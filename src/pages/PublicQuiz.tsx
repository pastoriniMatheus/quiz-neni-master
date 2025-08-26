import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import QuizPreview from '@/components/QuizPreview';
import { Quiz } from '@/types/quiz';

const PublicQuiz = () => {
  const { slug } = useParams<{ slug: string }>();
  // Removido: const [footerSettings, setFooterSettings] = useState(null); // Não é mais necessário aqui

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['public-quiz', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug não fornecido');

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      // Transform the database data to match our Quiz interface
      return {
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        slug: data.slug,
        sessions: (data.sessions as any) || [],
        settings: (data.settings as any) || {
          saveResponses: false,
          webhook: { enabled: false, url: '' },
          redirect: { enabled: false, url: '', delay: 5 },
          showFinalAd: false,
          testAdEnabled: false,
          customTexts: {
            processing: 'Processando suas respostas...',
            result: 'Resultado calculado!',
            adMessage: 'Publicidade'
          }
        },
        design: (data.design as any) || {
          primaryColor: '#000000',
          secondaryColor: '#666666',
          backgroundColor: '#ffffff',
          textColor: '#000000'
        },
        status: data.status as 'draft' | 'published',
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        config: data.config
      } as Quiz;
    },
    enabled: !!slug,
  });

  // Removido: Fetch footer settings from the quiz owner's profile
  // A lógica de footer_settings agora é buscada pela Edge Function e passada para o JS do plugin WP.
  // useEffect(() => {
  //   if (quiz?.user_id) {
  //     const fetchFooterSettings = async () => {
  //       try {
  //         const { data, error } = await supabase
  //           .from('profiles')
  //           .select('footer_settings')
  //           .eq('id', quiz.user_id)
  //           .single();

  //         if (!error && data?.footer_settings) {
  //           setFooterSettings(data.footer_settings as any);
  //         }
  //       } catch (error) {
  //         console.error('Erro ao buscar configurações do rodapé:', error);
  //       }
  //     };

  //     fetchFooterSettings();
  //   }
  // }, [quiz?.user_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz não encontrado</h1>
          <p className="text-muted-foreground">
            O quiz que você está procurando não existe ou não está publicado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Quiz Content - footerSettings não é mais passado diretamente */}
      <QuizPreview quiz={quiz} />
    </div>
  );
};

export default PublicQuiz;