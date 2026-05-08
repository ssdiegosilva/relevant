import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type PendingSession = {
  id: string;
  created_at: string;
  card_count: number;
  challenge_description: string;
  acted_count: number;
};

export function usePendingSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ['pending-sessions', userId],
    enabled: !!userId,
    queryFn: async (): Promise<PendingSession[]> => {
      const { data: sessions, error } = await supabase
        .from('daily_sessions')
        .select('id, created_at, card_count, challenges(description)')
        .eq('user_id', userId!)
        .is('completed_at', null)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const out: PendingSession[] = [];
      for (const s of (sessions ?? []) as any[]) {
        if (!s.card_count) continue;
        const { data: cardsRows } = await supabase
          .from('cards')
          .select('id')
          .eq('session_id', s.id);
        const cardIds = (cardsRows ?? []).map((r: any) => r.id);
        let actedCount = 0;
        if (cardIds.length) {
          const { data: ciRows } = await supabase
            .from('card_interactions')
            .select('card_id, action')
            .in('card_id', cardIds)
            .in('action', ['studied', 'saved', 'skipped']);
          actedCount = new Set((ciRows ?? []).map((r: any) => r.card_id)).size;
        }
        out.push({
          id: s.id,
          created_at: s.created_at,
          card_count: s.card_count,
          challenge_description: s.challenges?.description ?? 'Untitled',
          acted_count: actedCount,
        });
      }
      return out;
    },
  });
}
