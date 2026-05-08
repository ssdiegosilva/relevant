import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { supabase } from '@/src/lib/supabase';

export function useArchiveSession() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('daily_sessions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onMutate: async (sessionId) => {
      const key = ['pending-sessions', session?.user.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<any[]>(key);
      queryClient.setQueryData<any[]>(key, (old) => (old ?? []).filter((s) => s.id !== sessionId));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['pending-sessions', session?.user.id], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions', session?.user.id] });
    },
  });
}

export function useDeleteSession() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('daily_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onMutate: async (sessionId) => {
      const key = ['pending-sessions', session?.user.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<any[]>(key);
      queryClient.setQueryData<any[]>(key, (old) => (old ?? []).filter((s) => s.id !== sessionId));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['pending-sessions', session?.user.id], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions', session?.user.id] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-tree', session?.user.id] });
      queryClient.invalidateQueries({ queryKey: ['saved-cards', session?.user.id] });
    },
  });
}
