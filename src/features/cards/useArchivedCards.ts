import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { Card } from './types';

export function useArchivedCards(userId: string | undefined) {
  return useQuery({
    queryKey: ['archived-cards', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Card[]> => {
      const { data, error } = await supabase
        .from('cards')
        .select('*, daily_sessions!inner(archived_at)')
        .eq('user_id', userId!)
        .not('daily_sessions.archived_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Card[];
    },
  });
}
