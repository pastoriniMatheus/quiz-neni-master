import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Move, AlertCircle } from 'lucide-react';
import { QuizSession } from '@/types/quiz';

interface SessionEditorProps {
  session: QuizSession;
  index: number;
  onUpdate: (updates: Partial<QuizSession>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const SessionEditor: React.FC<SessionEditorProps> = ({
  session,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const addOption = () => {
    if (session.options) {
      onUpdate({
        options: [...session.options, `Opção ${session.options.length + 1}`]
      });
    }
  };

  const updateOption = (optionIndex: number, value: string) => {
    if (session.options) {
      const newOptions = [...session.options];
      newOptions[optionIndex] = value;
      onUpdate({ options: newOptions });
    }
  };

  const removeOption = (optionIndex: number) => {
    if (session.options && session.options.length > 2) {
      const newOptions = session.options.filter((_, i) => i !== optionIndex);
      onUpdate({ options: newOptions });
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'question':
        return 'Pergunta';
      case 'form':
        return 'Formulário';
      default:
        return 'Sessão';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-base">
                Sessão {index + 1} - {getSessionTypeLabel(session.type)}
              </CardTitle>
              <CardDescription>
                {session.type === 'question' ? 'Pergunta de múltipla escolha' : 'Formulário de coleta de dados'}
              </CardDescription>
            </div>
            {(!session.title || session.title.trim() === '') && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-6 px-2"
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-6 px-2"
            >
              ↓
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Tipo de Sessão</Label>
            <Select
              value={session.type}
              onValueChange={(value: 'question' | 'form') => onUpdate({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question">Pergunta</SelectItem>
                <SelectItem value="form">Formulário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>ID da Sessão</Label>
            <Input
              value={session.id}
              onChange={(e) => onUpdate({ id: e.target.value })}
              placeholder="ID único da sessão"
            />
          </div>
        </div>

        <div>
          <Label>Título da Sessão *</Label>
          <Input
            value={session.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={session.type === 'question' ? 'Digite a pergunta' : 'Título do formulário'}
            className={!session.title || session.title.trim() === '' ? 'border-amber-500' : ''}
          />
          {(!session.title || session.title.trim() === '') && (
            <p className="text-xs text-amber-600 mt-1">Título é obrigatório</p>
          )}
        </div>

        <div>
          <Label>Descrição (opcional)</Label>
          <Textarea
            value={session.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Descrição adicional ou instruções"
            rows={2}
          />
        </div>

        {session.type === 'question' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Opções de Resposta</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addOption}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Opção
              </Button>
            </div>
            
            <div className="space-y-2">
              {session.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground min-w-[20px]">
                    {optionIndex + 1}.
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`Opção ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  {session.options && session.options.length > 2 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeOption(optionIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )) || []}
            </div>
            
            {(!session.options || session.options.length < 2) && (
              <p className="text-xs text-amber-600 mt-1">
                Perguntas precisam de pelo menos 2 opções
              </p>
            )}
          </div>
        )}

        {session.type === 'form' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Campos do Formulário</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Formulários coletam dados como nome, email, telefone, etc.
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={session.formFields?.name || false}
                    onCheckedChange={(checked) => 
                      onUpdate({ 
                        formFields: { 
                          ...session.formFields, 
                          name: checked 
                        }
                      })
                    }
                  />
                  <Label className="text-sm">Nome</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={session.formFields?.email || false}
                    onCheckedChange={(checked) => 
                      onUpdate({ 
                        formFields: { 
                          ...session.formFields, 
                          email: checked 
                        }
                      })
                    }
                  />
                  <Label className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={session.formFields?.phone || false}
                    onCheckedChange={(checked) => 
                      onUpdate({ 
                        formFields: { 
                          ...session.formFields, 
                          phone: checked 
                        }
                      })
                    }
                  />
                  <Label className="text-sm">Telefone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={session.formFields?.message || false}
                    onCheckedChange={(checked) => 
                      onUpdate({ 
                        formFields: { 
                          ...session.formFields, 
                          message: checked 
                        }
                      })
                    }
                  />
                  <Label className="text-sm">Mensagem</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label>Mostrar Anúncio</Label>
              <p className="text-xs text-muted-foreground">
                Exibir anúncio intersticial após esta sessão
              </p>
            </div>
            <Switch
              checked={session.showAd}
              onCheckedChange={(checked) => onUpdate({ showAd: checked })}
            />
          </div>
          
          {session.showAd && (
            <div className="space-y-3">
              <div>
                <Label>Código do Anúncio</Label>
                <Textarea
                  value={session.adCode || ''}
                  onChange={(e) => onUpdate({ adCode: e.target.value })}
                  placeholder="Cole aqui o código HTML do seu anúncio (Google AdSense, etc.)"
                  rows={3}
                />
              </div>
              <div>
                <Label>Tempo de Exibição do Anúncio (segundos)</Label>
                <Input
                  type="number"
                  value={session.adDisplayTime || 5} // Novo campo
                  onChange={(e) => onUpdate({ adDisplayTime: Number(e.target.value) })}
                  min="1"
                  max="60"
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo para o botão "Continuar" aparecer neste anúncio.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tempo de Exibição (segundos)</Label>
              <Input
                type="number"
                value={session.displayTime || 0}
                onChange={(e) => onUpdate({ displayTime: Number(e.target.value) })}
                min="0"
                max="300"
                placeholder="0 = ilimitado"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = ilimitado, máximo 300 segundos
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={session.required || false}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
              <Label>Resposta obrigatória</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};