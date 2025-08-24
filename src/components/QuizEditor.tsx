import { useState } from 'react';
import { ArrowLeft, Plus, Settings, Eye, Save, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Quiz, QuizSession, QuizDesign } from '@/types/quiz';
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { SessionEditor } from '@/components/quiz/SessionEditor';
import { toast } from 'sonner';

interface QuizEditorProps {
  quiz: Quiz;
  onChange: (quiz: Quiz) => void;
}

const QuizEditor = ({ quiz, onChange }: QuizEditorProps) => {
  const [activeTab, setActiveTab] = useState('sessions');

  const updateQuiz = (updates: Partial<Quiz>) => {
    onChange({ ...quiz, ...updates });
  };

  const handleTemplateSelect = (design: QuizDesign) => {
    updateQuiz({ design });
    toast.success('Template aplicado com sucesso!');
  };

  const handleDesignChange = (field: keyof QuizDesign, value: string) => {
    const newDesign = { ...quiz.design, [field]: value };
    updateQuiz({ design: newDesign });
  };

  const addSession = (type: 'question' | 'form' = 'question') => {
    const newSession: QuizSession = {
      id: `session_${Date.now()}`,
      type,
      title: type === 'question' ? 'Nova pergunta' : 'Novo formulário',
      options: type === 'question' ? ['Opção 1', 'Opção 2'] : undefined,
      showAd: false,
      formFields: type === 'form' ? { name: true, email: true } : undefined,
      required: true,
      displayTime: 0,
      adDisplayTime: 5 // Novo padrão para anúncios de sessão
    };
    updateQuiz({ sessions: [...quiz.sessions, newSession] });
  };

  const updateSession = (sessionId: string, updates: Partial<QuizSession>) => {
    const updatedSessions = quiz.sessions.map(session => 
      session.id === sessionId ? { ...session, ...updates } : session
    );
    updateQuiz({ sessions: updatedSessions });
  };

  const removeSession = (sessionId: string) => {
    const filteredSessions = quiz.sessions.filter(session => session.id !== sessionId);
    updateQuiz({ sessions: filteredSessions });
  };

  const moveSession = (sessionId: string, direction: 'up' | 'down') => {
    const currentIndex = quiz.sessions.findIndex(s => s.id === sessionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= quiz.sessions.length) return;

    const newSessions = [...quiz.sessions];
    [newSessions[currentIndex], newSessions[newIndex]] = [newSessions[newIndex], newSessions[currentIndex]];
    
    updateQuiz({ sessions: newSessions });
  };

  const validateSessions = () => {
    const errors: string[] = [];
    
    quiz.sessions.forEach((session, index) => {
      if (!session.title || session.title.trim() === '') {
        errors.push(`Sessão ${index + 1}: Título é obrigatório`);
      }
      
      if (session.type === 'question' && (!session.options || session.options.length < 2)) {
        errors.push(`Sessão ${index + 1}: Perguntas precisam de pelo menos 2 opções`);
      }
      
      if (session.type === 'form' && !session.formFields) {
        errors.push(`Sessão ${index + 1}: Formulários precisam de pelo menos um campo`);
      }
    });
    
    return errors;
  };

  const sessionErrors = validateSessions();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="sessions" className="relative">
                  Sessões
                  {sessionErrors.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>Configure o título, descrição e URL do seu quiz</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título do Quiz</Label>
                      <Input
                        value={quiz.title}
                        onChange={(e) => updateQuiz({ title: e.target.value })}
                        placeholder="Digite o título do quiz"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={quiz.description}
                        onChange={(e) => updateQuiz({ description: e.target.value })}
                        placeholder="Descreva o objetivo do seu quiz"
                      />
                    </div>
                    <div>
                      <Label>URL Personalizada (Slug)</Label>
                      <Input
                        value={quiz.slug || ''}
                        onChange={(e) => updateQuiz({ slug: e.target.value })}
                        placeholder="meu-quiz-personalizado"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Se deixar em branco, será gerado automaticamente baseado no título
                      </p>
                      {quiz.slug && quiz.status === 'published' && (
                        <p className="text-xs text-green-600 mt-1">
                          Quiz disponível em: /quiz/{quiz.slug}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Sessões do Quiz</h3>
                    <p className="text-muted-foreground">
                      Configure as perguntas e etapas do seu quiz ({quiz.sessions.length} sessões)
                    </p>
                    {sessionErrors.length > 0 && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">Erros encontrados:</p>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                          {sessionErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => addSession('question')} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Pergunta
                    </Button>
                    <Button onClick={() => addSession('form')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Formulário
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pb-8">
                  {quiz.sessions.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          Nenhuma sessão criada ainda
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button onClick={() => addSession('question')} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Primeira Pergunta
                          </Button>
                          <Button onClick={() => addSession('form')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Primeiro Formulário
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    quiz.sessions.map((session, index) => (
                      <SessionEditor
                        key={session.id}
                        session={session}
                        index={index}
                        onUpdate={(updates) => updateSession(session.id, updates)}
                        onRemove={() => removeSession(session.id)}
                        onMoveUp={() => moveSession(session.id, 'up')}
                        onMoveDown={() => moveSession(session.id, 'down')}
                        canMoveUp={index > 0}
                        canMoveDown={index < quiz.sessions.length - 1}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Avançadas</CardTitle>
                    <CardDescription>Configure webhooks, redirecionamentos e coleta de dados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Salvar Respostas</Label>
                        <p className="text-xs text-muted-foreground">
                          Armazenar respostas dos usuários no sistema
                        </p>
                      </div>
                      <Switch
                        checked={quiz.settings.saveResponses}
                        onCheckedChange={(checked) => 
                          updateQuiz({ 
                            settings: { ...quiz.settings, saveResponses: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Webhook</Label>
                        <p className="text-xs text-muted-foreground">
                          Enviar dados para URL externa
                        </p>
                      </div>
                      <Switch
                        checked={quiz.settings.webhook.enabled}
                        onCheckedChange={(checked) => 
                          updateQuiz({ 
                            settings: { 
                              ...quiz.settings, 
                              webhook: { ...quiz.settings.webhook, enabled: checked }
                            }
                          })
                        }
                      />
                    </div>

                    {quiz.settings.webhook.enabled && (
                      <div>
                        <Label>URL do Webhook</Label>
                        <Input
                          value={quiz.settings.webhook.url}
                          onChange={(e) => 
                            updateQuiz({ 
                              settings: { 
                                ...quiz.settings, 
                                webhook: { ...quiz.settings.webhook, url: e.target.value }
                              }
                            })
                          }
                          placeholder="https://exemplo.com/webhook"
                        />
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Redirecionamento</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Habilitar Redirecionamento</Label>
                            <p className="text-xs text-muted-foreground">
                              Redirecionar usuário após completar o quiz
                            </p>
                          </div>
                          <Switch
                            checked={quiz.settings.redirect.enabled}
                            onCheckedChange={(enabled) => 
                              updateQuiz({ 
                                settings: { 
                                  ...quiz.settings, 
                                  redirect: { ...quiz.settings.redirect, enabled }
                                }
                              })
                            }
                          />
                        </div>

                        {quiz.settings.redirect.enabled && (
                          <>
                            <div>
                              <Label>URL de Redirecionamento</Label>
                              <Input
                                value={quiz.settings.redirect.url}
                                onChange={(e) => 
                                  updateQuiz({ 
                                    settings: { 
                                      ...quiz.settings, 
                                      redirect: { ...quiz.settings.redirect, url: e.target.value }
                                    }
                                  })
                                }
                                placeholder="https://exemplo.com/resultado"
                              />
                            </div>

                            <div>
                              <Label>Tempo de Redirecionamento (segundos)</Label>
                              <Input
                                type="number"
                                value={quiz.settings.redirect.delay}
                                onChange={(e) => 
                                  updateQuiz({ 
                                    settings: { 
                                      ...quiz.settings, 
                                      redirect: { ...quiz.settings.redirect, delay: Number(e.target.value) }
                                    }
                                  })
                                }
                                min="1"
                                max="10"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Processamento</h4>
                      <div>
                        <Label>Tempo de Processamento (segundos)</Label>
                        <Input
                          type="number"
                          value={quiz.settings.processingTime || 3}
                          onChange={(e) => 
                            updateQuiz({ 
                              settings: { 
                                ...quiz.settings, 
                                processingTime: Number(e.target.value) 
                              }
                            })
                          }
                          min="1"
                          max="30"
                          placeholder="3"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tempo de exibição da tela de processamento
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Anúncios</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Mostrar Anúncio Final</Label>
                            <p className="text-xs text-muted-foreground">
                              Exibir anúncio antes do resultado final
                            </p>
                          </div>
                          <Switch
                            checked={quiz.settings.showFinalAd}
                            onCheckedChange={(checked) => 
                              updateQuiz({ 
                                settings: { ...quiz.settings, showFinalAd: checked }
                              })
                            }
                          />
                        </div>

                        {quiz.settings.showFinalAd && (
                          <>
                            <div>
                              <Label>Código do Anúncio Final</Label>
                              <Textarea
                                value={quiz.settings.finalAdCode || ''}
                                onChange={(e) => 
                                  updateQuiz({ 
                                    settings: { 
                                      ...quiz.settings, 
                                      finalAdCode: e.target.value 
                                    }
                                  })
                                }
                                placeholder="Cole aqui o código HTML do seu anúncio (Google AdSense, etc.)"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Tempo de Exibição do Anúncio Final (segundos)</Label>
                              <Input
                                type="number"
                                value={quiz.settings.adDisplayTime || 5} // Novo campo
                                onChange={(e) => 
                                  updateQuiz({ 
                                    settings: { 
                                      ...quiz.settings, 
                                      adDisplayTime: Number(e.target.value) 
                                    }
                                  })
                                }
                                min="1"
                                max="60"
                                placeholder="5"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Tempo para o botão "Continuar" aparecer no anúncio final.
                              </p>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Modo de Teste de Anúncios</Label>
                            <p className="text-xs text-muted-foreground">
                              Simular anúncios durante os testes
                            </p>
                          </div>
                          <Switch
                            checked={quiz.settings.testAdEnabled}
                            onCheckedChange={(checked) => 
                              updateQuiz({ 
                                settings: { ...quiz.settings, testAdEnabled: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Textos Personalizados</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Texto de Processamento</Label>
                          <Input
                            value={quiz.settings.customTexts.processing}
                            onChange={(e) => 
                              updateQuiz({ 
                                settings: { 
                                  ...quiz.settings, 
                                  customTexts: { 
                                    ...quiz.settings.customTexts, 
                                    processing: e.target.value 
                                  }
                                }
                              })
                            }
                            placeholder="Processando suas informações..."
                          />
                        </div>

                        <div>
                          <Label>Texto de Resultado</Label>
                          <Input
                            value={quiz.settings.customTexts.result}
                            onChange={(e) => 
                              updateQuiz({ 
                                settings: { 
                                  ...quiz.settings, 
                                  customTexts: { 
                                    ...quiz.settings.customTexts, 
                                    result: e.target.value 
                                  }
                                }
                              })
                            }
                            placeholder="Encontramos uma oportunidade para você!"
                          />
                        </div>

                        <div>
                          <Label>Texto do Anúncio</Label>
                          <Input
                            value={quiz.settings.customTexts.adMessage}
                            onChange={(e) => 
                              updateQuiz({ 
                                settings: { 
                                  ...quiz.settings, 
                                  customTexts: { 
                                    ...quiz.settings.customTexts, 
                                    adMessage: e.target.value 
                                  }
                                }
                              })
                            }
                            placeholder="Veja um anúncio para continuar"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalização Visual</CardTitle>
                    <CardDescription>Escolha um template ou customize cores e aparência</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <TemplateSelector 
                      onSelectTemplate={handleTemplateSelect}
                      currentDesign={quiz.design}
                    />
                    
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Personalização Avançada</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Cor Primária</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={quiz.design.primaryColor}
                              onChange={(e) => handleDesignChange('primaryColor', e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={quiz.design.primaryColor}
                              onChange={(e) => handleDesignChange('primaryColor', e.target.value)}
                              placeholder="#3b82f6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor Secundária</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={quiz.design.secondaryColor}
                              onChange={(e) => handleDesignChange('secondaryColor', e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={quiz.design.secondaryColor}
                              onChange={(e) => handleDesignChange('secondaryColor', e.target.value)}
                              placeholder="#1e293b"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor de Fundo do Quiz</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={quiz.design.backgroundColor}
                              onChange={(e) => handleDesignChange('backgroundColor', e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={quiz.design.backgroundColor}
                              onChange={(e) => handleDesignChange('backgroundColor', e.target.value)}
                              placeholder="#ffffff"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor de Fundo da Página</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={quiz.design.pageBackgroundColor || quiz.design.backgroundColor}
                              onChange={(e) => handleDesignChange('pageBackgroundColor', e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={quiz.design.pageBackgroundColor || quiz.design.backgroundColor}
                              onChange={(e) => handleDesignChange('pageBackgroundColor', e.target.value)}
                              placeholder="#f1f1f1"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor do Texto</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={quiz.design.textColor}
                              onChange={(e) => handleDesignChange('textColor', e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={quiz.design.textColor}
                              onChange={(e) => handleDesignChange('textColor', e.target.value)}
                              placeholder="#1f2937"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Preview das Cores</h5>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: quiz.design.primaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Cor Primária (Botões)
                          </div>
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: quiz.design.secondaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Cor Secundária
                          </div>
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: quiz.design.backgroundColor,
                              color: quiz.design.textColor
                            }}
                          >
                            Fundo do Quiz com Texto
                          </div>
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: quiz.design.pageBackgroundColor || quiz.design.backgroundColor,
                              color: quiz.design.textColor
                            }}
                          >
                            Fundo da Página
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default QuizEditor;