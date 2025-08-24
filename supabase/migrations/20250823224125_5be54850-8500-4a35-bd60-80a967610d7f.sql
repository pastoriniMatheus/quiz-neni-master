
-- Criar tabela para gerenciar as chaves de API
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas para API Keys
CREATE POLICY "Users can view their own API keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar configurações do rodapé na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN footer_settings JSONB DEFAULT '{
  "showLocation": true,
  "showCounter": true,
  "locationScript": "",
  "counterScript": "",
  "companyName": "Quiz Builder",
  "privacyUrl": "",
  "termsUrl": ""
}'::jsonb;

-- Função para gerar chave de API única
CREATE OR REPLACE FUNCTION generate_api_key() 
RETURNS TEXT AS $$
BEGIN
  RETURN 'qb_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;
