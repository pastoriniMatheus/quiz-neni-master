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
    
    const headersObject = {};
    for (const [key, value] of req.headers.entries()) {
      headersObject[key.toLowerCase()] = value;
    }
    console.log(`[${requestId}] Headers received:`, JSON.stringify(headersObject, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ❌ Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const apiKey = req.headers.get('x-api-key')
    console.log(`[${requestId}] 🔑 API Key from header:`, apiKey ? `${apiKey.substring(0, 15)}...` : 'None');
    
    if (!apiKey) {
      console.log(`[${requestId}] ❌ No API Key provided`);
      return new Response(
        JSON.stringify({ error: 'API Key obrigatória' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] 🔍 Validating API Key...`);
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      console.log(`[${requestId}] ❌ Invalid API Key. DB Error:`, keyError?.message);
      return new Response(
        JSON.stringify({ error: 'API Key inválida ou expirada' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] ✅ Valid API Key for user:`, keyData.user_id);

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]

    if (req.method === 'GET' && (lastSegment === 'quizzes' || url.pathname.endsWith('/quizzes'))) {
      console.log(`[${requestId}] 📋 Fetching quizzes for user:`, keyData.user_id);
      
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('id, title, description, slug, status, created_at, updated_at')
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.log(`[${requestId}] ❌ Database error:`, error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log(`[${requestId}] ✅ Found ${quizzes?.length || 0} published quizzes`);
      return new Response(JSON.stringify(quizzes), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'GET' && lastSegment !== 'quizzes' && !url.pathname.endsWith('/quizzes')) {
      const quizIdOrSlug = lastSegment
      console.log(`[${requestId}] 🎯 Fetching specific quiz by ID or Slug:`, quizIdOrSlug);

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .or(`id.eq.${quizIdOrSlug},slug.eq.${quizIdOrSlug}`)
        .eq('user_id', keyData.user_id)
        .eq('status', 'published')
        .single()

      if (error || !quiz) {
        console.log(`[${requestId}] ❌ Quiz not found:`, error?.message);
        return new Response(JSON.stringify({ error: 'Quiz não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log(`[${requestId}] ✅ Quiz found:`, quiz.title);
      return new Response(JSON.stringify(quiz), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`[${requestId}] ❌ Endpoint not found:`, req.method, lastSegment);
    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})