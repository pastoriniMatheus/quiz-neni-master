
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAdminSetup = () => {
  const { data: hasAdmin, isLoading } = useQuery({
    queryKey: ['check-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin')
        .limit(1);
      
      if (error) {
        console.error('Error checking admin:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
  });

  const createAdminUser = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: 'Administrador',
            company_name: 'Sistema Quiz',
          });

        if (profileError) throw profileError;

        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin',
          });

        if (roleError) throw roleError;
      }

      return authData;
    },
    onSuccess: () => {
      toast.success('Usuário admin criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating admin:', error);
      toast.error('Erro ao criar usuário admin');
    },
  });

  return {
    hasAdmin,
    isLoading,
    createAdminUser: createAdminUser.mutate,
    isCreating: createAdminUser.isPending,
  };
};
