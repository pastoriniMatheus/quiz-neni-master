
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

export const useApiKeys = () => {
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
  });

  const createApiKey = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Gerar a chave usando a função do banco
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_api_key');

      if (keyError) throw keyError;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name,
          description,
          api_key: keyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Chave API criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar chave API');
    },
  });

  const updateApiKey = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiKey> & { id: string }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Chave API atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar chave API');
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Chave API removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover chave API');
    },
  });

  return {
    apiKeys,
    isLoading,
    createApiKey: createApiKey.mutate,
    updateApiKey: updateApiKey.mutate,
    deleteApiKey: deleteApiKey.mutate,
    isCreating: createApiKey.isPending,
    isUpdating: updateApiKey.isPending,
    isDeleting: deleteApiKey.isPending,
  };
};
