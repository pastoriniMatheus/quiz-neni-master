
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

export const SavedResponses: React.FC = () => {
  const { data: responses, isLoading } = useQuery({
    queryKey: ['responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          *,
          quizzes (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Respostas Salvas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as respostas dos seus quizzes
        </p>
      </div>

      <div className="grid gap-4">
        {responses?.map((response) => (
          <Card key={response.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {(response.quizzes as any)?.title || 'Quiz sem título'}
                  </CardTitle>
                  <CardDescription>
                    Respondido em{' '}
                    {new Date(response.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  ID: {response.session_id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!responses?.length && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma resposta salva encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
