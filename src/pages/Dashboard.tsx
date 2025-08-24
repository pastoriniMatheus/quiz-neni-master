
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
      
      // Conteúdo do plugin PHP
      const pluginContent = `<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.0.0
 * Author: NeniMaster
 */

// Evitar acesso direto
if (!defined('ABSPATH')) {
    exit;
}

class QuizNeniMaster {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_shortcode('quiz_nenimaster', array($this, 'shortcode_handler'));
    }
    
    public function init() {
        // Inicialização do plugin
    }
    
    public function admin_menu() {
        add_options_page(
            'Quiz NeniMaster',
            'Quiz NeniMaster',
            'manage_options',
            'quiz-nenimaster',
            array($this, 'admin_page')
        );
    }
    
    public function admin_page() {
        if (isset($_POST['save_settings'])) {
            update_option('quiz_nenimaster_api_url', sanitize_text_field($_POST['api_url']));
            update_option('quiz_nenimaster_api_key', sanitize_text_field($_POST['api_key']));
            echo '<div class="notice notice-success"><p>Configurações salvas!</p></div>';
        }
        
        $api_url = get_option('quiz_nenimaster_api_url', '');
        $api_key = get_option('quiz_nenimaster_api_key', '');
        ?>
        <div class="wrap">
            <h1>Quiz NeniMaster - Configurações</h1>
            <form method="post">
                <table class="form-table">
                    <tr>
                        <th scope="row">URL da API</th>
                        <td>
                            <input type="url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" />
                            <p class="description">Ex: https://quiz.paineldedisparos.com.br ou https://riqfafiivzpotfjqfscd.supabase.co</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Chave da API</th>
                        <td>
                            <input type="text" name="api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Salvar Configurações', 'primary', 'save_settings'); ?>
            </form>
        </div>
        <?php
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'slug' => '',
            'width' => '100%',
            'height' => '600px'
        ), $atts);
        
        if (empty($atts['slug'])) {
            return '<p>Erro: Slug do quiz não informado.</p>';
        }
        
        $api_url = get_option('quiz_nenimaster_api_url', '');
        $api_key = get_option('quiz_nenimaster_api_key', '');
        
        if (empty($api_url) || empty($api_key)) {
            return '<p>Erro: Configure a URL da API e chave nas configurações do plugin.</p>';
        }
        
        $quiz_url = rtrim($api_url, '/') . '/quiz/' . esc_attr($atts['slug']);
        
        return sprintf(
            '<iframe src="%s" width="%s" height="%s" frameborder="0" style="border:none; width:%s; height:%s;"></iframe>',
            esc_url($quiz_url),
            esc_attr($atts['width']),
            esc_attr($atts['height']),
            esc_attr($atts['width']),
            esc_attr($atts['height'])
        );
    }
}

// Inicializar o plugin
new QuizNeniMaster();
?>`;

      const readmeContent = `=== Quiz NeniMaster ===
Contributors: nenimaster
Tags: quiz, interactive, engagement
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPL v2 or later

Plugin oficial para integrar quizzes do NeniMaster no WordPress.

== Description ==

O Quiz NeniMaster permite integrar facilmente seus quizzes interativos em qualquer site WordPress usando um simples shortcode.

= Funcionalidades =

* Integração simples com shortcode
* Configuração fácil no painel admin
* Suporte a domínio personalizado
* Auto-redimensionamento responsivo

= Uso =

1. Instale e ative o plugin
2. Vá em Configurações > Quiz NeniMaster
3. Configure sua URL da API e chave
4. Use o shortcode: [quiz_nenimaster slug="seu-quiz"]

== Installation ==

1. Faça upload do plugin para '/wp-content/plugins/'
2. Ative o plugin através do menu 'Plugins' no WordPress
3. Configure em Configurações > Quiz NeniMaster

== Changelog ==

= 1.0.0 =
* Versão inicial do plugin`;
      
      // Importar JSZip dinamicamente
      const JSZip = (await import('jszip')).default;
      
      const zip = new JSZip();
      
      // Adicionar arquivos ao ZIP
      zip.file('quiz-nenimaster/quiz-nenimaster-plugin.php', pluginContent);
      zip.file('quiz-nenimaster/readme.txt', readmeContent);
      
      // Gerar o arquivo ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Criar link para download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiz-nenimaster-wordpress-plugin.zip';
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
              onClick={() => navigate('/quiz-builder')} 
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
                    onClick={() => navigate('/quiz-builder')} 
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
                        onClick={() => navigate(`/quiz-builder?id=${quiz.id}`)}
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
