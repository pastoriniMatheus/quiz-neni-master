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
    console.log(`[${requestId}] Received data: quizId=${quizId}, sessionId=${sessionId}, userAgent=${userAgent}, responseData keys=${Object.keys(responseData || {})}`);

    let clientIp: string | null = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (clientIp) {
      clientIp = clientIp.split(',')[0].trim();
    }
    if (!clientIp || clientIp.toLowerCase() === 'unknown') {
      clientIp = null;
    }
    console.log(`[${requestId}] 🌐 Processed Client IP: ${clientIp}`);

    if (!quizId || !sessionId || !responseData) {
      console.error(`[${requestId}] ❌ Missing required data: quizId=${quizId}, sessionId=${sessionId}, responseData=${responseData}`);
      return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes: quizId, sessionId, responseData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- NOVO LOGGING: Verificar status do quiz com SERVICE_ROLE_KEY ---
    console.log(`[${requestId}] Verifying quiz status for quizId: ${quizId} using service role client.`);
    const { data: quizCheck, error: quizCheckError } = await supabaseService
      .from('quizzes')
      .select('status')
      .eq('id', quizId)
      .single();

    if (quizCheckError) {
      console.error(`[${requestId}] 💥 Error fetching quiz status with service role:`, quizCheckError);
    } else if (quizCheck) {
      console.log(`[${requestId}] ✅ Quiz status (via service role): ${quizCheck.status}`);
    } else {
      console.log(`[${requestId}] ⚠️ Quiz not found with service role for ID: ${quizId}`);
    }
    // --- FIM NOVO LOGGING ---

    // 1. Salvar a resposta no banco de dados usando o cliente ANON
    console.log(`[${requestId}] Attempting to insert response for quizId=${quizId} with sessionId=${sessionId} using ANON_KEY.`);
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
      console.error(`[${requestId}] 💥 Error inserting response into 'responses' table:`, insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar resposta do quiz', details: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    console.log(`[${requestId}] ✅ Response inserted with ID: ${newResponse.id}`);

    // 2. Buscar configurações do quiz para verificar webhook usando o cliente SERVICE_ROLE
    console.log(`[${requestId}] Attempting to fetch quiz settings for quizId=${quizId} using service role client.`);
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
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          console.error(`[${requestId}] ❌ Error sending to webhook (${webhookUrl}): ${webhookResponse.status} ${webhookResponse.statusText}`);
        } else {
          console.log(`[${requestId}] ✅ Webhook sent successfully to ${webhookUrl}. Status: ${webhookResponse.status}`);
        }
      } catch (webhookFetchError) {
        console.error(`[${requestId}] 💥 Network error sending to webhook (${webhookUrl}):`, webhookFetchError);
      }
    } else {
      console.log(`[${requestId}] Webhook not enabled or URL missing for quizId=${quizId}.`);
    }

    console.log(`[${requestId}] ✅ Quiz response ${newResponse.id} saved and processed. Returning success.`);
    return new Response(JSON.stringify({ message: 'Resposta salva com sucesso!', responseId: newResponse.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno desconhecido na Edge Function' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})