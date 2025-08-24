
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FooterSettings {
  showLocation: boolean;
  showCounter: boolean;
  locationScript: string;
  counterScript: string;
  companyName: string;
  privacyUrl: string;
  termsUrl: string;
  footerText: string;
}

const defaultFooterSettings: FooterSettings = {
  showLocation: true,
  showCounter: true,
  locationScript: '',
  counterScript: '',
  companyName: 'Quiz NeniMaster',
  privacyUrl: '',
  termsUrl: '',
  footerText: '© {year} {companyName}',
};

export const useFooterSettings = () => {
  const queryClient = useQueryClient();

  const { data: footerSettings, isLoading } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('footer_settings')
        .single();

      if (error) throw error;
      
      // Handle the case where footer_settings might be null or not properly structured
      const settings = data.footer_settings as unknown;
      if (!settings || typeof settings !== 'object') {
        return defaultFooterSettings;
      }
      
      return { ...defaultFooterSettings, ...settings } as FooterSettings;
    },
  });

  const updateFooterSettings = useMutation({
    mutationFn: async (settings: FooterSettings) => {
      const { error } = await supabase
        .from('profiles')
        .update({ footer_settings: settings as any })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      toast.success('Configurações do rodapé atualizadas!');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações do rodapé');
    },
  });

  return {
    footerSettings,
    isLoading,
    updateFooterSettings: updateFooterSettings.mutate,
    isUpdating: updateFooterSettings.isPending,
  };
};
