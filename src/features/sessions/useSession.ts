import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { Card, CardAction } from '../cards/types';

export type SessionData = {
  cards: Card[];
  interactions: { card_id: string; action: CardAction }[];
};

export function useSession(sessionId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionId],
    enabled: !!sessionId && !!userId,
    queryFn: async (): Promise<SessionData> => {
      const { data: cards, error: cErr } = await supabase
        .from('cards')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at');
      if (cErr) throw cErr;

      const list = (cards ?? []) as Card[];
      if (list.length === 0) return { cards: [], interactions: [] };

      const { data: interactions, error: iErr } = await supabase
        .from('card_interactions')
        .select('card_id, action')
        .eq('user_id', userId!)
        .in(
          'card_id',
          list.map((c) => c.id),
        )
        .in('action', ['studied', 'saved', 'skipped']);
      if (iErr) throw iErr;

      return { cards: list, interactions: (interactions ?? []) as any };
    },
  });
}
