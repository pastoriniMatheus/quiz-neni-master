import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] 📥 ${req.method} ${req.url}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key obrigatória' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'API Key inválida ou expirada' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts.pop() || pathParts.pop(); // Handle trailing slash

    // Rota para buscar um quiz específico por slug
    if (req.method === 'GET' && slug && slug !== 'quiz-api') {
      console.log(`[${requestId}] 🎯 Matched slug=${slug}. Fetching quiz.`);
      
      // 1. Fetch the quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .single()

      if (quizError) {
        return new Response(JSON.stringify({ error: 'Quiz não encontrado ou não publicado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // 2. Fetch the owner's footer settings
      let footerSettings = null;
      if (quizData.user_id) {
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('footer_settings')
              .eq('id', quizData.user_id)
              .single();
          
          if (profileError) {
              console.warn(`[${requestId}] ⚠️ Could not fetch profile for user ${quizData.user_id}:`, profileError.message);
          } else {
              footerSettings = profileData.footer_settings;
          }
      }

      // 3. Combine and return
      const responsePayload = {
          ...quizData,
          footer_settings: footerSettings
      };

      return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`[${requestId}] ❌ No route matched.`);
    return new Response(JSON.stringify({ error: 'Ação ou slug não especificado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})