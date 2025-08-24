
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdminPanel: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [quizzes, responses, users] = await Promise.all([
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('responses').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]);

      return {
        quizzes: quizzes.count || 0,
        responses: responses.count || 0,
        users: users.count || 0
      };
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e monitore estatísticas do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total de Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.quizzes || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.responses || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.users || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Administrativas</CardTitle>
          <CardDescription>
            Ferramentas para gerenciamento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Gerenciar Usuários</h3>
                <p className="text-sm text-muted-foreground">
                  Visualizar e gerenciar contas de usuários
                </p>
              </div>
              <Button variant="outline">Acessar</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Configurações do Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Configurar parâmetros globais do sistema
                </p>
              </div>
              <Button variant="outline">Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
