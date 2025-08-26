import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Users, BarChart3, Settings, ExternalLink, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: recentQuizzes } = useQuery({
    queryKey: ['recent-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, status, created_at, slug')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [quizzes, responses] = await Promise.all([
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('responses').select('id', { count: 'exact' })
      ]);

      return {
        quizzes: quizzes.count || 0,
        responses: responses.count || 0
      };
    },
  });

  const downloadPlugin = async () => {
    try {
      console.log('Iniciando download do plugin...');
      
      const jszip = (await import('jszip')).default;
      const zip = new jszip();

      const filesToZip = [
        'api-quiz-builder/api-quiz-builder.php',
        'api-quiz-builder/includes/class-api-quiz-builder.php',
        'api-quiz-builder/includes/class-api-quiz-builder-loader.php',
        'api-quiz-builder/includes/class-api-quiz-builder-gutenberg.php',
        'api-quiz-builder/public/class-api-quiz-builder-public.php',
        'api-quiz-builder/public/js/api-quiz-renderer.js',
        'api-quiz-builder/public/css/api-quiz-builder-public.css',
        'api-quiz-builder/admin/class-api-quiz-builder-admin.php',
        'api-quiz-builder/admin/css/api-quiz-builder-admin.css',
        'api-quiz-builder/admin/js/api-quiz-builder-admin.js',
        'api-quiz-builder/admin/js/gutenberg-block.js',
      ];

      for (const path of filesToZip) {
        const content = await fetch(`/${path}`).then(res => res.text());
        zip.file(path, content);
      }
      
      // Gerar o arquivo ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Criar link para download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'api-quiz-builder-wordpress-plugin.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Plugin WordPress baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar plugin:', error);
      toast.error('Erro ao baixar o plugin. Tente novamente.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Quiz NeniMaster. Gerencie seus quizzes e veja estatísticas.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Quizzes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.quizzes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.responses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/quiz/novo')} 
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Quiz
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugin WordPress</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={downloadPlugin} 
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar ZIP
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes Recentes</CardTitle>
            <CardDescription>Seus últimos quizzes criados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum quiz criado ainda</p>
                  <Button 
                    onClick={() => navigate('/quiz/novo')} 
                    className="mt-4"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Quiz
                  </Button>
                </div>
              ) : (
                recentQuizzes?.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={quiz.status === 'published' ? 'default' : 'secondary'}>
                          {quiz.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/quiz/${quiz.id}/editar`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {quiz.status === 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/quiz/${quiz.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;