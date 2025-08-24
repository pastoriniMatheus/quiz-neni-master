
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye, EyeOff, Copy, BookOpen, ExternalLink } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';

export const ApiKeysManager: React.FC = () => {
  const { apiKeys, isLoading, createApiKey, deleteApiKey, isCreating } = useApiKeys();
  const [newKeyData, setNewKeyData] = useState({ name: '', description: '' });
  const [showInstructions, setShowInstructions] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});

  const handleCreateKey = () => {
    if (!newKeyData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    createApiKey(newKeyData);
    setNewKeyData({ name: '', description: '' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const baseUrl = 'https://riqfafiivzpotfjqfscd.supabase.co';
  const apiUrl = `${baseUrl}/functions/v1/quiz-api`;

  return (
    <div className="space-y-6">
      {/* Instruções da API */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Instruções da API
              </CardTitle>
              <CardDescription>
                Como usar a API para integrar com WordPress ou outros sistemas
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Ocultar' : 'Mostrar'} Instruções
            </Button>
          </div>
        </CardHeader>

        {showInstructions && (
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">URL Base da API:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-background px-2 py-1 rounded text-sm flex-1">
                      {apiUrl}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Autenticação:</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione o header <code className="bg-background px-1 rounded">x-api-key</code> com sua chave API em todas as requisições.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Endpoints Disponíveis:</h4>
                
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/quizzes</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lista todos os quizzes publicados do usuário
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/quiz/{`{id}`}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obter dados completos de um quiz específico
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Exemplo de Uso:</h4>
                
                <div className="bg-background border rounded p-3">
                  <pre className="text-xs overflow-x-auto">
{`fetch('${apiUrl}/quizzes', {
  headers: {
    'x-api-key': 'sua-chave-aqui'
  }
})
.then(res => res.json())
.then(data => console.log(data));`}
                  </pre>
                </div>

                <div className="bg-background border rounded p-3">
                  <pre className="text-xs overflow-x-auto">
{`// WordPress Shortcode
[quiz_nenimaster slug="quiz-id"]`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Plugin WordPress</h5>
                  <p className="text-sm text-blue-700">
                    <strong>URL do Sistema:</strong> https://riqfafiivzpotfjqfscd.supabase.co<br/>
                    Configure esta URL no plugin WordPress e use sua chave API para conectar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Gerenciamento de Chaves API */}
      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>
            Gerencie chaves de acesso para integração com WordPress e outros sistemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Criar nova chave */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Criar Nova Chave</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Nome da Chave *</Label>
                <Input
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  placeholder="Ex: Plugin WordPress"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={newKeyData.description}
                  onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                  placeholder="Ex: Para o site principal"
                />
              </div>
            </div>
            <Button onClick={handleCreateKey} disabled={isCreating} className="gap-2">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Criando...' : 'Criar Chave'}
            </Button>
          </div>

          {/* Lista de chaves */}
          <div className="space-y-3">
            <h4 className="font-medium">Chaves Existentes ({apiKeys?.length || 0})</h4>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando chaves...</p>
              </div>
            ) : apiKeys?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma chave API criada ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys?.map((key) => (
                  <div key={key.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{key.name}</h5>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        {key.description && (
                          <p className="text-sm text-muted-foreground mb-2">{key.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {visibleKeys[key.id] ? key.api_key : '••••••••••••••••••••••••••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key.api_key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criada em {new Date(key.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteApiKey(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
