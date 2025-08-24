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
    const params = url.searchParams;
    const action = params.get('action');
    const slug = params.get('slug');

    // Rota para listar todos os quizzes
    if (req.method === 'GET' && action === 'list') {
      console.log(`[${requestId}] 📋 Matched action=list. Fetching for user:`, keyData.user_id);
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, slug, status')
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Rota para buscar um quiz específico
    if (req.method === 'GET' && slug) {
      console.log(`[${requestId}] 🎯 Matched slug=${slug}. Fetching quiz.`);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: 'Quiz não encontrado ou não publicado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`[${requestId}] ❌ No route matched.`);
    return new Response(JSON.stringify({ error: 'Ação ou slug não especificado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})