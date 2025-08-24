import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Code } from 'lucide-react';
import { toast } from 'sonner';

interface ShortcodeDisplayProps {
  quizId: string;
  slug: string;
  status: 'draft' | 'published';
}

export const ShortcodeDisplay: React.FC<ShortcodeDisplayProps> = ({
  quizId,
  slug,
  status,
}) => {
  const shortcode = `[quiz_nenimaster slug="${slug}"]`;
  const quizUrl = `${window.location.origin}/quiz/${slug}`;

  const copyShortcode = () => {
    navigator.clipboard.writeText(shortcode);
    toast.success('Shortcode copiado para WordPress!');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(quizUrl);
    toast.success('URL copiada!');
  };

  if (status !== 'published') {
    return (
      <div className="bg-muted/30 rounded-lg p-4 text-center border-2 border-dashed border-muted-foreground/20">
        <Code className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <Badge variant="secondary" className="mb-2">Rascunho</Badge>
        <p className="text-sm text-muted-foreground">
          Publique o quiz para gerar o shortcode WordPress
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Publicado
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(quizUrl, '_blank')}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Shortcode WordPress
          </label>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-md border flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-600" />
            <code className="flex-1 text-sm font-mono text-blue-600">{shortcode}</code>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={copyShortcode}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            URL Direta
          </label>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-md border flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gray-600" />
            <code className="flex-1 text-xs break-all text-gray-600">{quizUrl}</code>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={copyUrl}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};