import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type StudiedTopic = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  cardCount: number;
};

export type Domain = {
  root: { id: string; slug: string; name: string };
  children: StudiedTopic[];
  rootCardCount: number;
  totalCards: number;
};

export function useKnowledgeTree(userId: string | undefined) {
  return useQuery({
    queryKey: ['knowledge-tree', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Domain[]> => {
      const { data: ciRows, error: ciErr } = await supabase
        .from('card_interactions')
        .select('card_id')
        .eq('user_id', userId!)
        .in('action', ['studied', 'saved']);
      if (ciErr) throw ciErr;
      const studiedCardIds = Array.from(new Set((ciRows ?? []).map((r: any) => r.card_id)));
      if (studiedCardIds.length === 0) {
        return [];
      }

      const { data: ctRows, error: ctErr } = await supabase
        .from('card_topics')
        .select('card_id, topic_id, topics(id,slug,name,parent_id)')
        .in('card_id', studiedCardIds);
      if (ctErr) throw ctErr;

      const topicMap = new Map<string, StudiedTopic>();
      const seenPair = new Set<string>();
      for (const row of (ctRows ?? []) as any[]) {
        const t = row.topics;
        if (!t) continue;
        const pairKey = `${row.card_id}:${t.id}`;
        if (seenPair.has(pairKey)) continue;
        seenPair.add(pairKey);
        const existing = topicMap.get(t.id);
        if (existing) {
          existing.cardCount += 1;
        } else {
          topicMap.set(t.id, {
            id: t.id,
            slug: t.slug,
            name: t.name,
            parent_id: t.parent_id,
            cardCount: 1,
          });
        }
      }

      const { data: rootRows, error: rootErr } = await supabase
        .from('topics')
        .select('id, slug, name')
        .is('parent_id', null)
        .eq('verified', true);
      if (rootErr) throw rootErr;
      const roots = rootRows ?? [];

      const childrenByParent = new Map<string, StudiedTopic[]>();
      const orphans: StudiedTopic[] = [];
      for (const t of topicMap.values()) {
        if (t.parent_id) {
          if (!childrenByParent.has(t.parent_id)) childrenByParent.set(t.parent_id, []);
          childrenByParent.get(t.parent_id)!.push(t);
        } else if (!roots.find((r) => r.id === t.id)) {
          orphans.push(t);
        }
      }

      const tree: Domain[] = [];
      for (const root of roots) {
        const children = (childrenByParent.get(root.id) ?? []).sort((a, b) => b.cardCount - a.cardCount);
        const rootStudied = topicMap.get(root.id);
        if (children.length === 0 && !rootStudied) continue;
        const rootCardCount = rootStudied?.cardCount ?? 0;
        const totalCards = children.reduce((s, c) => s + c.cardCount, 0) + rootCardCount;
        tree.push({
          root: { id: root.id, slug: root.slug, name: root.name },
          children,
          rootCardCount,
          totalCards,
        });
      }

      if (orphans.length > 0) {
        tree.push({
          root: { id: 'other', slug: 'other', name: 'Other' },
          children: orphans.sort((a, b) => b.cardCount - a.cardCount),
          rootCardCount: 0,
          totalCards: orphans.reduce((s, c) => s + c.cardCount, 0),
        });
      }

      return tree.sort((a, b) => b.totalCards - a.totalCards);
    },
  });
}
