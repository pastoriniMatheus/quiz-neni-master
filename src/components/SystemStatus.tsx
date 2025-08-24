
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, TestTube, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const SystemStatus: React.FC = () => {
  const { user } = useAuth();
  const { apiKeys } = useApiKeys();

  const testApiEndpoint = async () => {
    if (!apiKeys || apiKeys.length === 0) {
      toast.error('Nenhuma chave API encontrada. Crie uma chave primeiro.');
      return;
    }

    const activeKey = apiKeys.find(key => key.is_active);
    if (!activeKey) {
      toast.error('Nenhuma chave API ativa encontrada.');
      return;
    }

    console.log('🔍 Testando API com chave:', activeKey.api_key.substring(0, 10) + '...');
    
    try {
      // Testar endpoint /quizzes
      const response = await fetch('https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/quiz-api/quizzes', {
        method: 'GET',
        headers: {
          'x-api-key': activeKey.api_key,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Response body:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        toast.success(`✅ API funcionando! Encontrados ${data.count || 0} quizzes`);
        console.log('✅ Dados retornados:', data);
      } else {
        toast.error(`❌ Erro ${response.status}: ${responseText}`);
        console.error('❌ Erro na API:', response.status, responseText);
      }
    } catch (error) {
      console.error('💥 Erro ao testar API:', error);
      toast.error('Erro de conexão: ' + error.message);
    }
  };

  const { data: systemChecks, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async (): Promise<SystemCheck[]> => {
      const checks: SystemCheck[] = [];

      // Check authentication
      if (user) {
        checks.push({
          name: 'Autenticação',
          status: 'success',
          message: 'Usuário autenticado com sucesso'
        });
      } else {
        checks.push({
          name: 'Autenticação',
          status: 'error',
          message: 'Usuário não autenticado'
        });
      }

      // Check database connection
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        checks.push({
          name: 'Conexão com Banco de Dados',
          status: 'success',
          message: 'Conectado ao Supabase'
        });
      } catch (error) {
        checks.push({
          name: 'Conexão com Banco de Dados',
          status: 'error',
          message: 'Erro na conexão com o banco'
        });
      }

      // Check API keys
      try {
        const { data: keys, error } = await supabase.from('api_keys').select('count').limit(1);
        if (error) throw error;
        checks.push({
          name: 'Sistema de API Keys',
          status: 'success',
          message: 'Sistema de chaves funcionando'
        });
      } catch (error) {
        checks.push({
          name: 'Sistema de API Keys',
          status: 'error',
          message: 'Erro ao acessar chaves API'
        });
      }

      // Check edge function
      try {
        const response = await fetch('https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/quiz-api/quizzes', {
          method: 'OPTIONS'
        });
        
        if (response.status === 200) {
          checks.push({
            name: 'Edge Function Quiz API',
            status: 'success',
            message: 'Function respondendo (CORS OK)'
          });
        } else {
          checks.push({
            name: 'Edge Function Quiz API',
            status: 'warning',
            message: `Function respondeu com status ${response.status}`
          });
        }
      } catch (error) {
        checks.push({
          name: 'Edge Function Quiz API',
          status: 'error',
          message: 'Erro ao conectar com a function'
        });
      }

      return checks;
    },
    refetchInterval: 30000,
  });

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>Verificando funcionalidades...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>Verificação das funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemChecks?.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium">{check.name}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste da API
          </CardTitle>
          <CardDescription>
            Teste direto da API usando sua chave ativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Informações da API:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>URL:</strong> https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/quiz-api</p>
              <p><strong>Chaves ativas:</strong> {apiKeys?.filter(k => k.is_active).length || 0}</p>
              <p><strong>Total de chaves:</strong> {apiKeys?.length || 0}</p>
            </div>
          </div>
          
          <Button 
            onClick={testApiEndpoint} 
            className="w-full gap-2"
            disabled={!apiKeys || apiKeys.length === 0}
          >
            <Key className="h-4 w-4" />
            Testar API Endpoint
          </Button>
          
          {(!apiKeys || apiKeys.length === 0) && (
            <p className="text-sm text-muted-foreground text-center">
              Vá para a aba "Acesso" para criar uma chave API primeiro
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
