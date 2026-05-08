import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { Card } from '../cards/types';

export function useTopicCards(userId: string | undefined, topicId: string | null) {
  return useQuery({
    queryKey: ['topic-cards', userId, topicId],
    enabled: !!userId && !!topicId,
    queryFn: async (): Promise<Card[]> => {
      const { data, error } = await supabase
        .from('card_topics')
        .select('cards!inner(*)')
        .eq('topic_id', topicId!)
        .eq('cards.user_id', userId!)
        .order('card_id');
      if (error) throw error;
      const seen = new Set<string>();
      const cards: Card[] = [];
      for (const row of (data ?? []) as any[]) {
        const card = row.cards as Card | null;
        if (!card || seen.has(card.id)) continue;
        seen.add(card.id);
        cards.push(card);
      }
      return cards.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  });
}
