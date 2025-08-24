
-- Adicionar coluna slug para URLs personalizadas dos quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Criar índice para o slug para buscas mais rápidas
CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);

-- Adicionar coluna para armazenar configurações de empresa
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_settings jsonb DEFAULT '{}';

-- Criar função para gerar slug automaticamente se não fornecido
CREATE OR REPLACE FUNCTION generate_quiz_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(
      regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )) || '-' || substring(NEW.id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar slug automaticamente
DROP TRIGGER IF EXISTS quiz_slug_trigger ON public.quizzes;
CREATE TRIGGER quiz_slug_trigger
  BEFORE INSERT OR UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quiz_slug();

-- Atualizar quizzes existentes com slugs se não tiverem
UPDATE public.quizzes 
SET slug = lower(regexp_replace(
  regexp_replace(COALESCE(title, 'quiz'), '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
)) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL OR slug = '';

-- Adicionar RLS policy para permitir acesso público aos quizzes publicados via slug
CREATE POLICY "Anyone can view published quizzes by slug" 
  ON public.quizzes 
  FOR SELECT 
  USING (status = 'published');

-- Criar policy para permitir inserção de respostas anônimas
CREATE POLICY "Anyone can submit quiz responses" 
  ON public.responses 
  FOR INSERT 
  WITH CHECK (true);
