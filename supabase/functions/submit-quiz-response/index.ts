import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] 📥 ${req.method} ${req.url}`);
    
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')! 
    )

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { quizId, sessionId, userAgent, responseData } = await req.json();

    let clientIp: string | null = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (!clientIp || clientIp.toLowerCase() === 'unknown') {
      clientIp = null;
    }
    
    if (!quizId || !sessionId || !responseData) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes: quizId, sessionId, responseData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: newResponse, error: insertError } = await supabaseAnon
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
      console.error(`[${requestId}] 💥 Erro detalhado ao inserir resposta:`, JSON.stringify(insertError, null, 2));
      // Retorna o erro completo para diagnóstico no cliente
      return new Response(JSON.stringify({ 
        error: 'Erro ao salvar resposta do quiz', 
        details: insertError 
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: quizSettings, error: quizError } = await supabaseService
      .from('quizzes')
      .select('settings')
      .eq('id', quizId)
      .single();

    if (quizError) {
      console.warn(`[${requestId}] ⚠️ Não foi possível buscar configurações do quiz ${quizId} para webhook:`, quizError.message);
    } else if (quizSettings?.settings?.webhook?.enabled && quizSettings.settings.webhook.url) {
      const webhookUrl = quizSettings.settings.webhook.url;
      try {
        const webhookResponse = await fetch(webhookUrl, {
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
        if (!webhookResponse.ok) {
          console.error(`[${requestId}] ❌ Erro ao enviar para webhook (${webhookUrl}): ${webhookResponse.status} ${webhookResponse.statusText}`);
        }
      } catch (webhookFetchError) {
        console.error(`[${requestId}] 💥 Erro de rede ao enviar para webhook (${webhookUrl}):`, webhookFetchError);
      }
    }

    return new Response(JSON.stringify({ message: 'Resposta salva com sucesso!', responseId: newResponse.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})