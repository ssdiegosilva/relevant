import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type TopicStudied = { id: string; slug: string; name: string; card_count: number };

export function useTopicsStudied(userId: string | undefined) {
  return useQuery({
    queryKey: ['topics-studied', userId],
    enabled: !!userId,
    queryFn: async (): Promise<TopicStudied[]> => {
      const { data: ci } = await supabase
        .from('card_interactions')
        .select('card_id')
        .eq('user_id', userId!)
        .in('action', ['studied', 'saved']);
      const studiedCardIds = Array.from(new Set((ci ?? []).map((r: any) => r.card_id)));
      if (studiedCardIds.length === 0) return [];

      const { data, error } = await supabase
        .from('card_topics')
        .select('card_id, topic_id, topics(id,slug,name)')
        .in('card_id', studiedCardIds);
      if (error) throw error;
      const counts = new Map<string, TopicStudied>();
      const seen = new Set<string>();
      for (const row of (data ?? []) as any[]) {
        const t = row.topics;
        if (!t) continue;
        const key = `${row.card_id}:${t.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const existing = counts.get(t.id);
        if (existing) existing.card_count += 1;
        else counts.set(t.id, { id: t.id, slug: t.slug, name: t.name, card_count: 1 });
      }
      return [...counts.values()].sort((a, b) => b.card_count - a.card_count);
    },
  });
}
