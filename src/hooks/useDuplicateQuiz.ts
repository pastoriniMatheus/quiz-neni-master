
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Quiz } from '@/types/quiz';

export const useDuplicateQuiz = () => {
  const queryClient = useQueryClient();

  const duplicateQuiz = useMutation({
    mutationFn: async (quiz: Quiz) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Gerar novo slug único
      const timestamp = Date.now();
      const newSlug = `${quiz.slug}-copia-${timestamp}`;
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: `${quiz.title} (Cópia)`,
          description: quiz.description,
          slug: newSlug,
          sessions: quiz.sessions as any,
          settings: quiz.settings as any,
          design: quiz.design as any,
          status: 'draft',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz duplicado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao duplicar quiz');
    },
  });

  return {
    duplicateQuiz: duplicateQuiz.mutate,
    isDuplicating: duplicateQuiz.isPending,
  };
};
