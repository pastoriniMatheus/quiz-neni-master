
-- Criar o usuário como admin usando o ID do token JWT
INSERT INTO public.user_roles (user_id, role)
VALUES ('b8b526b7-7f43-4a21-96d6-70b886a8cdf4', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se o usuário foi criado corretamente
SELECT ur.*, p.full_name, p.email 
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.id
WHERE ur.user_id = 'b8b526b7-7f43-4a21-96d6-70b886a8cdf4';
