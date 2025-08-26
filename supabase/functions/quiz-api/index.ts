import { serve } from "https://deno.land/std@0.190.0/http/server.ts" // Atualizado para uma versão mais recente
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0' // Atualizado para uma versão mais recente

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] 📥 ${req.method} ${req.url}`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const apiKey = req.headers.get('x-api-key')
    console.log(`[${requestId}] Received API Key (first 8 chars): ${apiKey ? apiKey.substring(0, 8) : 'N/A'}`);

    if (!apiKey) {
      console.warn(`[${requestId}] ⚠️ Missing API Key.`);
      return new Response(JSON.stringify({ error: 'API Key obrigatória' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      console.warn(`[${requestId}] ⚠️ Invalid or expired API Key. Error: ${keyError?.message || 'No key data'}`);
      return new Response(JSON.stringify({ error: 'API Key inválida ou expirada' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    console.log(`[${requestId}] ✅ API Key valid for user_id: ${keyData.user_id}`);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const pathParts = url.pathname.split('/');
    // O slug pode vir como o último segmento da URL ou como um parâmetro de busca, dependendo de como o WP o envia.
    // Priorizamos o slug do path, se existir e não for 'quiz-api'.
    let slug = pathParts.pop();
    if (slug === 'quiz-api') { // Se o último segmento for 'quiz-api', significa que não há slug no path
      slug = null;
    }
    // Se não encontrou no path, tenta do search params (para compatibilidade)
    if (!slug) {
      slug = url.searchParams.get('slug');
    }

    console.log(`[${requestId}] Action: ${action}, Slug: ${slug}`);

    // Rota para listar todos os quizzes do usuário (usado no admin do WP)
    if (req.method === 'GET' && action === 'list_all') {
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, slug')
            .eq('user_id', keyData.user_id) // Mantém o filtro de user_id para listar os quizzes do usuário
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (error) {
          console.error(`[${requestId}] 💥 Error listing quizzes for user ${keyData.user_id}:`, error);
          throw error;
        }
        console.log(`[${requestId}] ✅ Listed ${data?.length || 0} quizzes for user ${keyData.user_id}.`);
        return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rota para buscar um quiz específico por slug (usado no frontend do WP)
    if (req.method === 'GET' && slug) {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (quizError) {
        console.warn(`[${requestId}] ⚠️ Quiz not found or not published for slug '${slug}'. Error: ${quizError.message}`);
        return new Response(JSON.stringify({ error: 'Quiz não encontrado ou não publicado', details: quizError.message }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      let footerSettings = null;
      if (quizData.user_id) {
          const { data: profileData } = await supabase.from('profiles').select('footer_settings').eq('id', quizData.user_id).single();
          footerSettings = profileData ? profileData.footer_settings : null;
      }
      console.log(`[${requestId}] ✅ Successfully retrieved quiz for slug '${slug}'.`);
      const responsePayload = { ...quizData, footer_settings: footerSettings };
      return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.warn(`[${requestId}] ⚠️ No valid action or slug specified.`);
    return new Response(JSON.stringify({ error: 'Ação ou slug não especificado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(`[${requestId}] 💥 Internal server error in Edge Function:`, error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})