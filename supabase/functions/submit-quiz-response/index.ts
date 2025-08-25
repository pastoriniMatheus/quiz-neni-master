import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] 📥 ${req.method} ${req.url}`);

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const requestBody = await req.json();
    const { quizId, sessionId, userAgent, responseData } = requestBody;

    let clientIp: string | null = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (clientIp) {
      clientIp = clientIp.split(',')[0].trim();
    }
    if (!clientIp || clientIp.toLowerCase() === 'unknown') {
      clientIp = null;
    }

    if (!quizId || !sessionId || !responseData) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes: quizId, sessionId, responseData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Salvar a resposta no banco de dados usando o cliente SERVICE_ROLE para bypassar RLS
    console.log(`[${requestId}] Attempting to insert response for quizId=${quizId} using SERVICE_ROLE_KEY.`);
    const { data: newResponse, error: insertError } = await supabaseService
      .from('responses')
      .insert({
        quiz_id: quizId,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: clientIp,
        data: responseData,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${requestId}] 💥 Error inserting response into 'responses' table:`, insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar resposta do quiz', details: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    console.log(`[${requestId}] ✅ Response inserted with ID: ${newResponse.id}`);

    // 2. Buscar configurações do quiz para verificar webhook
    const { data: quizSettings, error: quizError } = await supabaseService
      .from('quizzes')
      .select('settings')
      .eq('id', quizId)
      .single();

    if (quizError) {
      console.warn(`[${requestId}] ⚠️ Could not fetch quiz settings for quizId=${quizId}:`, quizError.message);
    } else if (quizSettings?.settings?.webhook?.enabled && quizSettings.settings.webhook.url) {
      const webhookUrl = quizSettings.settings.webhook.url;
      console.log(`[${requestId}] 📡 Webhook enabled. Sending data to: ${webhookUrl}`);
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId,
            sessionId,
            userAgent,
            ipAddress: clientIp,
            responseData,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookFetchError) {
        console.error(`[${requestId}] 💥 Network error sending to webhook (${webhookUrl}):`, webhookFetchError);
      }
    }

    return new Response(JSON.stringify({ message: 'Resposta salva com sucesso!', responseId: newResponse.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(`[${requestId}] 💥 Internal server error in Edge Function:`, error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})