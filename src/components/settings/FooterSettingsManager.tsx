
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFooterSettings } from '@/hooks/useFooterSettings';

export const FooterSettingsManager: React.FC = () => {
  const { footerSettings, isLoading, updateFooterSettings, isUpdating } = useFooterSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Rodapé</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!footerSettings) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const settings = {
      showLocation: formData.get('showLocation') === 'on',
      showCounter: formData.get('showCounter') === 'on',
      locationScript: formData.get('locationScript') as string,
      counterScript: formData.get('counterScript') as string,
      companyName: formData.get('companyName') as string,
      privacyUrl: formData.get('privacyUrl') as string,
      termsUrl: formData.get('termsUrl') as string,
      footerText: formData.get('footerText') as string,
    };

    updateFooterSettings(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Rodapé</CardTitle>
        <CardDescription>
          Configure os textos e scripts exibidos no rodapé dos quizzes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch
                name="showLocation"
                defaultChecked={footerSettings.showLocation}
              />
              <Label>Mostrar Localização</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                name="showCounter"
                defaultChecked={footerSettings.showCounter}
              />
              <Label>Mostrar Contador</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={footerSettings.companyName}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div>
            <Label htmlFor="footerText">Texto do Rodapé</Label>
            <Input
              id="footerText"
              name="footerText"
              defaultValue={footerSettings.footerText || `© {year} {companyName}`}
              placeholder="© {year} {companyName}"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {`{year}`} para o ano atual e {`{companyName}`} para o nome da empresa
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="privacyUrl">URL Política de Privacidade</Label>
              <Input
                id="privacyUrl"
                name="privacyUrl"
                defaultValue={footerSettings.privacyUrl}
                placeholder="https://exemplo.com/privacidade"
              />
            </div>
            <div>
              <Label htmlFor="termsUrl">URL Termos de Uso</Label>
              <Input
                id="termsUrl"
                name="termsUrl"
                defaultValue={footerSettings.termsUrl}
                placeholder="https://exemplo.com/termos"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="locationScript">Script de Localização</Label>
            <Textarea
              id="locationScript"
              name="locationScript"
              defaultValue={footerSettings.locationScript}
              placeholder="Cole aqui o script personalizado para detectar localização"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para usar o script padrão de detecção de IP
            </p>
          </div>

          <div>
            <Label htmlFor="counterScript">Script do Contador</Label>
            <Textarea
              id="counterScript"
              name="counterScript"
              defaultValue={footerSettings.counterScript}
              placeholder="Cole aqui o script personalizado para o contador"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para usar o contador padrão animado
            </p>
          </div>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
