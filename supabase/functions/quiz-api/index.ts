
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'false',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🚀 Handling CORS preflight request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] 📥 ${req.method} ${req.url}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log(`[${requestId}] 🔧 Supabase URL:`, supabaseUrl);
    console.log(`[${requestId}] 🔧 Service Key exists:`, !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ❌ Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuração do servidor incompleta',
          message: 'Entre em contato com o administrador'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar API Key
    const apiKey = req.headers.get('x-api-key')
    console.log(`[${requestId}] 🔑 API Key received:`, apiKey ? `${apiKey.substring(0, 15)}...` : 'None');
    
    if (!apiKey) {
      console.log(`[${requestId}] ❌ No API Key provided`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API Key obrigatória',
          message: 'Inclua o header x-api-key com sua chave de API',
          code: 'MISSING_API_KEY'
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar API Key no banco
    console.log(`[${requestId}] 🔍 Validating API Key in database...`);
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active, name')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    console.log(`[${requestId}] 📊 Key validation result:`, { 
      found: !!keyData, 
      error: keyError?.message,
      isActive: keyData?.is_active 
    });

    if (keyError || !keyData) {
      console.log(`[${requestId}] ❌ Invalid API Key:`, keyError?.message || 'Not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API Key inválida ou expirada',
          message: 'Verifique sua chave de API nas configurações do sistema',
          code: 'INVALID_API_KEY',
          debug: {
            keyProvided: !!apiKey,
            keyLength: apiKey?.length,
            error: keyError?.message
          }
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`[${requestId}] ✅ Valid API Key for user:`, keyData.user_id, '- Name:', keyData.name);

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]

    console.log(`[${requestId}] 🛤️ Processing route:`, lastSegment, '- Full path:', url.pathname);

    // GET /quiz-api/quizzes - Listar quizzes do usuário
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
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Erro interno do servidor',
            message: error.message,
            code: 'DATABASE_ERROR'
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`[${requestId}] ✅ Found ${quizzes?.length || 0} published quizzes`);
      
      const response = {
        success: true,
        data: quizzes || [],
        count: quizzes?.length || 0,
        message: `${quizzes?.length || 0} quiz(es) encontrado(s)`,
        requestId
      }
      
      return new Response(
        JSON.stringify(response), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // GET /quiz-api/quiz/{id} - Obter quiz específico
    if (req.method === 'GET' && lastSegment !== 'quizzes' && !url.pathname.endsWith('/quizzes')) {
      const quizId = lastSegment
      console.log(`[${requestId}] 🎯 Fetching specific quiz:`, quizId);

      // Tentar buscar por ID primeiro, depois por slug
      let quiz = null;
      let searchError = null;

      // Buscar por UUID (ID)
      if (quizId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log(`[${requestId}] 🔍 Searching by UUID:`, quizId);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('user_id', keyData.user_id)
          .eq('status', 'published')
          .single()
        
        quiz = data;
        searchError = error;
      } 
      
      // Se não encontrou por ID, buscar por slug
      if (!quiz) {
        console.log(`[${requestId}] 🔍 Searching by slug:`, quizId);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('slug', quizId)
          .eq('user_id', keyData.user_id)
          .eq('status', 'published')
          .single()
        
        quiz = data;
        searchError = error;
      }

      if (searchError || !quiz) {
        console.log(`[${requestId}] ❌ Quiz not found:`, searchError?.message || 'Does not exist');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Quiz não encontrado',
            message: `Quiz com identificador '${quizId}' não foi encontrado ou não está publicado`,
            code: 'QUIZ_NOT_FOUND'
          }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Buscar configurações do rodapé do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('footer_settings')
        .eq('id', keyData.user_id)
        .single()

      console.log(`[${requestId}] ✅ Quiz found:`, quiz.title);
      
      const response = {
        success: true,
        quiz: quiz,
        footer_settings: profile?.footer_settings || {},
        message: 'Quiz carregado com sucesso',
        requestId
      }
      
      return new Response(
        JSON.stringify(response), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`[${requestId}] ❌ Endpoint not found:`, req.method, lastSegment);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Endpoint não encontrado',
        message: `Endpoint '${req.method} ${url.pathname}' não existe`,
        code: 'ENDPOINT_NOT_FOUND',
        available_endpoints: [
          'GET /functions/v1/quiz-api/quizzes',
          'GET /functions/v1/quiz-api/quiz/{id-ou-slug}'
        ]
      }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Internal server error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
        message: error?.message || 'Erro desconhecido',
        code: 'INTERNAL_ERROR'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
