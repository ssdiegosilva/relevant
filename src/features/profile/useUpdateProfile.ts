import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { supabase } from '@/src/lib/supabase';

type ProfileUpdate = {
  role?: string;
  experience_years?: number;
  interests?: string[];
  goals?: string;
};

export function useUpdateProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      if (!userId) throw new Error('No session');
      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;
    },
    onMutate: async (update) => {
      const key = ['profile', userId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<any>(key);
      queryClient.setQueryData<any>(key, (old: any) => (old ? { ...old, ...update } : old));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['profile', userId], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
