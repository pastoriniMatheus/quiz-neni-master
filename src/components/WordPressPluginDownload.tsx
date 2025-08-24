
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const WordPressPluginDownload: React.FC = () => {
  const downloadPlugin = async () => {
    try {
      // Criar o conteúdo do plugin PHP
      const pluginContent = await fetch('/src/wordpress-plugin/quiz-nenimaster-plugin.php').then(res => res.text());
      const readmeContent = await fetch('/src/wordpress-plugin/readme.txt').then(res => res.text());
      
      // Importar JSZip dinamicamente para reduzir bundle inicial
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Plugin WordPress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Baixe o plugin oficial do Quiz NeniMaster para WordPress e integre seus quizzes facilmente em qualquer site.
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Funcionalidades do Plugin:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Shortcode simples: <code className="bg-background px-1 rounded">[quiz_nenimaster slug="seu-quiz"]</code></li>
            <li>• Integração automática com a API</li>
            <li>• Configuração fácil no painel admin</li>
            <li>• Suporte a domínio personalizado e Supabase</li>
            <li>• Auto-redimensionamento responsivo</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={downloadPlugin} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar Plugin (.zip)
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => window.open('/src/wordpress-plugin/readme.txt', '_blank')}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <strong>Dica:</strong> Após instalar no WordPress, configure a URL do sistema e sua chave API nas configurações do plugin.
        </div>
      </CardContent>
    </Card>
  );
};
