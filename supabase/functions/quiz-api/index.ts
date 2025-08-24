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

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const apiSegmentIndex = pathSegments.findIndex(p => p === 'quiz-api')

    if (apiSegmentIndex === -1) {
      return new Response(JSON.stringify({ error: 'Endpoint inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const action = pathSegments[apiSegmentIndex + 1]
    const param = pathSegments[apiSegmentIndex + 2]

    // Rota para listar todos os quizzes: GET /quiz-api/quizzes
    if (req.method === 'GET' && action === 'quizzes') {
      console.log(`[${requestId}] 📋 Fetching quizzes for user:`, keyData.user_id);
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, slug, status')
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Rota para buscar um quiz específico: GET /quiz-api/quiz/{slug}
    if (req.method === 'GET' && action === 'quiz' && param) {
      const quizIdOrSlug = param;
      console.log(`[${requestId}] 🎯 Fetching specific quiz by Slug:`, quizIdOrSlug);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', quizIdOrSlug)
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: 'Quiz não encontrado ou não publicado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})