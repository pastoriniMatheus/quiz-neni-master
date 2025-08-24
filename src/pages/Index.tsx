import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Copy, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Quiz } from '@/types/quiz';
import { toast } from 'sonner';
import { ShortcodeDisplay } from '@/components/quiz/ShortcodeDisplay';
import { useDuplicateQuiz } from '@/hooks/useDuplicateQuiz';

const Index = () => {
  const queryClient = useQueryClient();
  const { duplicateQuiz, isDuplicating } = useDuplicateQuiz();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(quiz => ({
        id: quiz.id,
        title: quiz.title || '',
        description: quiz.description || '',
        slug: quiz.slug,
        sessions: (quiz.sessions as any) || [],
        settings: (quiz.settings as any) || {
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
        design: (quiz.design as any) || {
          primaryColor: '#000000',
          secondaryColor: '#666666',
          backgroundColor: '#ffffff',
          textColor: '#000000'
        },
        status: quiz.status as 'draft' | 'published',
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        user_id: quiz.user_id,
        config: quiz.config
      })) as Quiz[];
    },
  });

  const createQuiz = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const slug = `quiz-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          description: 'Novo quiz',
          slug,
          sessions: [],
          settings: {
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
          design: {
            primaryColor: '#000000',
            secondaryColor: '#666666',
            backgroundColor: '#ffffff',
            textColor: '#000000'
          },
          status: 'draft',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz criado com sucesso!');
      window.location.href = `/quiz/${data.id}/editar`;
    },
    onError: () => {
      toast.error('Erro ao criar quiz');
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover quiz');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meus Quizzes
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie seus quizzes interativos</p>
          </div>
          <Button disabled className="animate-pulse">
            <Plus className="mr-2 h-4 w-4" />
            Novo Quiz
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded flex-1"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meus Quizzes
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie seus quizzes interativos</p>
          </div>
          <Button onClick={() => createQuiz.mutate()} disabled={createQuiz.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quiz
          </Button>
        </div>
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
            <Plus className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">Comece criando seu primeiro quiz</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Crie quizzes interativos e envolventes para capturar leads e engajar sua audiência
          </p>
          <Button 
            onClick={() => createQuiz.mutate()} 
            disabled={createQuiz.isPending}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Criar Primeiro Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Meus Quizzes
          </h1>
          <p className="text-muted-foreground mt-1">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} criado{quizzes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => createQuiz.mutate()} 
          disabled={createQuiz.isPending}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="line-clamp-1 text-lg">
                    {quiz.title || 'Quiz sem título'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {quiz.description || 'Sem descrição'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={quiz.status === 'published' ? 'default' : 'secondary'}>
                    {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => duplicateQuiz(quiz)} disabled={isDuplicating}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteQuiz.mutate(quiz.id)}
                        disabled={deleteQuiz.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Criado: {new Date(quiz.created_at).toLocaleDateString('pt-BR')}</p>
                <p>Sessões: {quiz.sessions?.length || 0}</p>
              </div>

              <ShortcodeDisplay 
                quizId={quiz.id}
                slug={quiz.slug}
                status={quiz.status}
              />

              <div className="flex gap-2 pt-2">
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link to={`/quiz/${quiz.id}/editar`}>
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Link>
                </Button>
                
                {quiz.status === 'published' && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Link to={`/quiz/${quiz.slug}`} target="_blank">
                      <Eye className="mr-2 h-3 w-3" />
                      Visualizar
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
