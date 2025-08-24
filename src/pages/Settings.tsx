
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/ui/theme-provider';
import { Monitor, Moon, Sun, Key, Settings as SettingsIcon } from 'lucide-react';
import { ApiKeysManager } from '@/components/settings/ApiKeysManager';
import { FooterSettingsManager } from '@/components/settings/FooterSettingsManager';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro sempre ativo'
    },
    {
      value: 'dark' as const,
      label: 'Escuro',
      icon: Moon,
      description: 'Tema escuro sempre ativo'
    },
    {
      value: 'system' as const,
      label: 'Sistema',
      icon: Monitor,
      description: 'Segue a configuração do sistema'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do seu sistema
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Rodapé
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Acesso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Tema da Interface</CardTitle>
              <CardDescription>
                Escolha como você prefere visualizar a interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.value;
                  
                  return (
                    <Button
                      key={themeOption.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-auto p-4 flex flex-col items-center gap-2 text-center"
                      onClick={() => setTheme(themeOption.value)}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{themeOption.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {themeOption.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <FooterSettingsManager />
        </TabsContent>

        <TabsContent value="api">
          <ApiKeysManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
