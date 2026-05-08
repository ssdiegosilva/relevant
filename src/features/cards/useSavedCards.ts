import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { Card } from './types';

export function useSavedCards(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-cards', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Card[]> => {
      const { data, error } = await supabase
        .from('card_interactions')
        .select('card_id, created_at, cards(*)')
        .eq('user_id', userId!)
        .eq('action', 'saved')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const seen = new Set<string>();
      const cards: Card[] = [];
      for (const row of (data ?? []) as any[]) {
        const card = row.cards as Card | null;
        if (!card) continue;
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        cards.push(card);
      }
      return cards;
    },
  });
}
