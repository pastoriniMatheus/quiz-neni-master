import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuizPreview from '@/components/QuizPreview';
import { Quiz, QuizSession, QuizSettings, QuizDesign } from '@/types/quiz';

export const QuizView: React.FC = () => {
  const { id } = useParams();

  const { data: quizData, isLoading, error } = useQuery({
    queryKey: ['quiz-view', id],
    queryFn: async () => {
      if (!id) throw new Error('Quiz ID not found');
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          O quiz que você está procurando não existe ou foi removido.
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Safely convert Json types to our TypeScript interfaces
  const sessions: QuizSession[] = Array.isArray(quizData.sessions) 
    ? (quizData.sessions as unknown as QuizSession[])
    : [];

  const settings: QuizSettings = (quizData.settings && typeof quizData.settings === 'object' && !Array.isArray(quizData.settings))
    ? (quizData.settings as unknown as QuizSettings)
    : {
        saveResponses: false,
        webhook: { enabled: false, url: '' },
        redirect: { enabled: false, url: '', delay: 3 },
        showFinalAd: false,
        testAdEnabled: false,
        customTexts: {
          processing: 'Processando suas informações...',
          result: 'Encontramos uma oportunidade para você!',
          adMessage: 'Veja um anúncio para continuar'
        }
      };

  // Ensure customTexts exists in settings
  if (!settings.customTexts) {
    settings.customTexts = {
      processing: 'Processando suas informações...',
      result: 'Encontramos uma oportunidade para você!',
      adMessage: 'Veja um anúncio para continuar'
    };
  }

  const design: QuizDesign = (quizData.design && typeof quizData.design === 'object' && !Array.isArray(quizData.design))
    ? (quizData.design as unknown as QuizDesign)
    : {
        primaryColor: '#3b82f6',
        secondaryColor: '#1e293b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
      };

  const status: 'draft' | 'published' = (quizData.status === 'draft' || quizData.status === 'published')
    ? quizData.status
    : 'draft';

  const quiz: Quiz = {
    title: quizData.title || '',
    description: quizData.description || '',
    sessions,
    settings,
    design,
    status
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">
              {quiz.title || 'Quiz sem título'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualização do quiz
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
          <Link to={`/quiz/${id}/editar`}>
            <Button size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* O footerSettings não é mais passado para QuizPreview, pois a lógica de footer é tratada pelo plugin WP */}
        <QuizPreview quiz={quiz} />
      </div>
    </div>
  );
};