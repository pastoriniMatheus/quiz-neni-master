
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminSetup } from '@/hooks/useAdminSetup';
import { Shield } from 'lucide-react';

export const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('admin@sistema.com');
  const [password, setPassword] = useState('admin123');
  const { hasAdmin, isLoading, createAdminUser, isCreating } = useAdminSetup();

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminUser({ email, password });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse text-center">Verificando configuração...</div>
        </CardContent>
      </Card>
    );
  }

  if (hasAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Sistema Configurado
          </CardTitle>
          <CardDescription>
            Usuário administrador já foi configurado no sistema.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configuração Inicial do Sistema
        </CardTitle>
        <CardDescription>
          Crie o primeiro usuário administrador do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">E-mail do Administrador</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Criando...' : 'Criar Administrador'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
