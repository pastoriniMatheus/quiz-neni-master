import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QuizEditor from '@/components/QuizEditor';
import QuizPreview from '@/components/QuizPreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save, Eye, ArrowLeft, ExternalLink } from 'lucide-react';
import { Quiz, QuizSession, QuizSettings, QuizDesign } from '@/types/quiz';

export const QuizBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    slug: '',
    sessions: [],
    settings: {
      saveResponses: false,
      webhook: { enabled: false, url: '' },
      redirect: { enabled: false, url: '', delay: 3 },
      showFinalAd: false,
      finalAdCode: '',
      testAdEnabled: false,
      processingTime: 3,
      adDisplayTime: 5, // Novo padrão
      customTexts: {
        processing: 'Processando suas informações...',
        result: 'Encontramos uma oportunidade para você!',
        adMessage: 'Veja um anúncio para continuar'
      }
    },
    design: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e293b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    },
    status: 'draft'
  });

  const [showPreview, setShowPreview] = useState(false);

  // Load existing quiz if editing
  const { data: existingQuiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingQuiz) {
      const sessions = Array.isArray(existingQuiz.sessions) 
        ? (existingQuiz.sessions as unknown as QuizSession[]).map(session => ({
            ...session,
            adDisplayTime: session.adDisplayTime ?? 5 // Padrão para anúncios de sessão
          }))
        : [];

      const settings = (existingQuiz.settings && typeof existingQuiz.settings === 'object' && !Array.isArray(existingQuiz.settings))
        ? (existingQuiz.settings as unknown as QuizSettings)
        : {
            saveResponses: false,
            webhook: { enabled: false, url: '' },
            redirect: { enabled: false, url: '', delay: 3 },
            showFinalAd: false,
            finalAdCode: '',
            testAdEnabled: false,
            processingTime: 3,
            adDisplayTime: 5, // Novo padrão
            customTexts: {
              processing: 'Processando suas informações...',
              result: 'Encontramos uma oportunidade para você!',
              adMessage: 'Veja um anúncio para continuar'
            }
          };

      // Ensure all new fields exist in settings
      if (!settings.customTexts) {
        settings.customTexts = {
          processing: 'Processando suas informações...',
          result: 'Encontramos uma oportunidade para você!',
          adMessage: 'Veja um anúncio para continuar'
        };
      }
      if (settings.processingTime === undefined) {
        settings.processingTime = 3;
      }
      if (settings.finalAdCode === undefined) {
        settings.finalAdCode = '';
      }
      if (settings.adDisplayTime === undefined) { // Novo campo
        settings.adDisplayTime = 5;
      }

      const design = (existingQuiz.design && typeof existingQuiz.design === 'object' && !Array.isArray(existingQuiz.design))
        ? (existingQuiz.design as unknown as QuizDesign)
        : {
            primaryColor: '#3b82f6',
            secondaryColor: '#1e293b',
            backgroundColor: '#ffffff',
            textColor: '#1f2937'
          };

      setQuiz({
        id: existingQuiz.id,
        title: existingQuiz.title || '',
        description: existingQuiz.description || '',
        slug: existingQuiz.slug || '',
        sessions, // Usar sessões atualizadas
        settings,
        design,
        status: (existingQuiz.status as 'draft' | 'published') || 'draft'
      });
    }
  }, [existingQuiz]);

  const saveQuizMutation = useMutation({
    mutationFn: async (quizData: Quiz) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        title: quizData.title,
        description: quizData.description,
        slug: quizData.slug,
        sessions: quizData.sessions as any,
        settings: quizData.settings as any,
        design: quizData.design as any,
        status: quizData.status,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from('quizzes')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('quizzes')
          .insert({
            ...payload,
            user_id: user.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(isEditing ? 'Quiz atualizado!' : 'Quiz salvo!');
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', data.id] });
      if (!isEditing) {
        navigate(`/quiz/${data.id}/editar`);
      }
    },
    onError: () => {
      toast.error('Erro ao salvar quiz');
    },
  });

  const handleSave = () => {
    saveQuizMutation.mutate(quiz);
  };

  const handlePublish = () => {
    const publishedQuiz = { ...quiz, status: 'published' as const };
    setQuiz(publishedQuiz);
    saveQuizMutation.mutate(publishedQuiz);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const quizUrl = quiz.slug && quiz.status === 'published' 
    ? `${window.location.origin}/quiz/${quiz.slug}` 
    : null;

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border p-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="font-semibold">
              {isEditing ? 'Editar Quiz' : 'Novo Quiz'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {quiz.title || 'Quiz sem título'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quizUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(quizUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Quiz
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Editor' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveQuizMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveQuizMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={saveQuizMutation.isPending}
          >
            Publicar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <QuizPreview quiz={quiz} />
        ) : (
          <QuizEditor quiz={quiz} onChange={setQuiz} />
        )}
      </div>
    </div>
  );
};