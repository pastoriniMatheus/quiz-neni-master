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
    
    // Use o cliente Service Role para todas as operações para ignorar RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { quizId, sessionId, userAgent, responseData } = await req.json();

    // Captura o endereço IP real do cliente a partir dos cabeçalhos da requisição
    let clientIp: string | null = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    
    // Se o IP for 'unknown' ou não for detectado, defina como null
    if (!clientIp || clientIp.toLowerCase() === 'unknown') {
      clientIp = null;
    }
    
    console.log(`[${requestId}] 🌐 Client IP: ${clientIp}`);

    if (!quizId || !sessionId || !responseData) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios ausentes: quizId, sessionId, responseData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Salvar a resposta no banco de dados usando o cliente de SERVIÇO
    const { data: newResponse, error: insertError } = await supabase
      .from('responses')
      .insert({
        quiz_id: quizId,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: clientIp, // Usar o IP capturado e sanitizado
        data: responseData,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${requestId}] 💥 Erro ao inserir resposta:`, insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar resposta do quiz', details: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Buscar configurações do quiz para verificar webhook
    const { data: quizSettings, error: quizError } = await supabase
      .from('quizzes')
      .select('settings')
      .eq('id', quizId)
      .single();

    if (quizError) {
      console.warn(`[${requestId}] ⚠️ Não foi possível buscar configurações do quiz ${quizId} para webhook:`, quizError.message);
    } else if (quizSettings?.settings?.webhook?.enabled && quizSettings.settings.webhook.url) {
      const webhookUrl = quizSettings.settings.webhook.url;
      console.log(`[${requestId}] 📡 Enviando dados para webhook: ${webhookUrl}`);
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
            ipAddress: clientIp, // Enviar o IP real para o webhook
            responseData,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`[${requestId}] ❌ Erro ao enviar para webhook (${webhookUrl}): ${webhookResponse.status} ${webhookResponse.statusText}`);
        } else {
          console.log(`[${requestId}] ✅ Webhook enviado com sucesso para ${webhookUrl}`);
        }
      } catch (webhookFetchError) {
        console.error(`[${requestId}] 💥 Erro de rede ao enviar para webhook (${webhookUrl}):`, webhookFetchError);
      }
    }

    console.log(`[${requestId}] ✅ Resposta do quiz ${quizId} salva e processada.`);
    return new Response(JSON.stringify({ message: 'Resposta salva com sucesso!', responseId: newResponse.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})