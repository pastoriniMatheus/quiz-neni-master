import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QuizSession } from '@/types/quiz';

// Helper para formatar os dados JSON de forma legível
const formatResponseData = (data: any, quizSessions: QuizSession[]) => {
  if (!data || typeof data !== 'object') return 'Nenhum dado disponível.';

  const formatted: string[] = [];

  // Primeiro, tente mapear as respostas para as sessões do quiz
  quizSessions.forEach(session => {
    if (session.type === 'question' && data[session.id]) {
      formatted.push(`<strong>${session.title}:</strong> ${data[session.id]}`);
    } else if (session.type === 'form' && session.formFields) {
      const formResponses: string[] = [];
      if (session.formFields.name && data.name) formResponses.push(`Nome: ${data.name}`);
      if (session.formFields.email && data.email) formResponses.push(`Email: ${data.email}`);
      if (session.formFields.phone && data.phone) formResponses.push(`Telefone: ${data.phone}`);
      if (session.formFields.message && data.message) formResponses.push(`Mensagem: ${data.message}`);
      if (formResponses.length > 0) {
        formatted.push(`<strong>${session.title}:</strong> ${formResponses.join(', ')}`);
      }
    }
  });

  // Adicionar quaisquer outros dados que não foram mapeados para sessões específicas
  Object.entries(data).forEach(([key, value]) => {
    const isMapped = quizSessions.some(session => session.id === key || (session.type === 'form' && session.formFields && Object.keys(session.formFields).includes(key)));
    if (!isMapped) {
      formatted.push(`<strong>${key}:</strong> ${String(value)}`);
    }
  });

  return formatted.length > 0 ? formatted.join('<br/>') : JSON.stringify(data, null, 2);
};


export const SavedResponses: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedResponses, setSelectedResponses] = useState<Set<number>>(new Set());

  const { data: responses, isLoading } = useQuery({
    queryKey: ['responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          id,
          created_at,
          data,
          session_id,
          user_agent,
          ip_address,
          quizzes (
            id,
            title,
            slug,
            sessions // Buscar as sessões do quiz para interpretar as respostas
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteResponsesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase
        .from('responses')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responses'] });
      setSelectedResponses(new Set()); // Limpar seleção
      toast.success('Respostas selecionadas removidas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover respostas.');
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (!responses) return;
    if (checked) {
      const allIds = new Set(responses.map(r => r.id));
      setSelectedResponses(allIds);
    } else {
      setSelectedResponses(new Set());
    }
  };

  const handleSelectResponse = (id: number, checked: boolean) => {
    setSelectedResponses(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedResponses.size === 0) {
      toast.info('Nenhuma resposta selecionada para exclusão.');
      return;
    }
    deleteResponsesMutation.mutate(Array.from(selectedResponses));
  };

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Todas as Respostas ({responses?.length || 0})</CardTitle>
          {selectedResponses.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir Selecionados ({selectedResponses.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente {selectedResponses.size} respostas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {(!responses || responses.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma resposta salva encontrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedResponses.size === responses.length && responses.length > 0}
                        onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Respostas</TableHead>
                    <TableHead>Sessão ID</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => {
                    // Adicionado verificações de segurança para quiz e sessions
                    const quizTitle = (response.quizzes as any)?.title || 'Quiz sem título';
                    const quizSessions = (response.quizzes as any)?.sessions || [];
                    const formattedData = formatResponseData(response.data, quizSessions);

                    return (
                      <TableRow key={response.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedResponses.has(response.id)}
                            onCheckedChange={(checked: boolean) => handleSelectResponse(response.id, checked)}
                            aria-label={`Selecionar resposta ${response.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{quizTitle}</TableCell>
                        <TableCell>{new Date(response.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-md" dangerouslySetInnerHTML={{ __html: formattedData }} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{response.session_id?.substring(0, 8)}...</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente esta resposta.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteResponsesMutation.mutate([response.id])} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};