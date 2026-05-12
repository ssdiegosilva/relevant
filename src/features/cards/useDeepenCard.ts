import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { CardDeepening } from './types';

type DeepenResponse = {
  id: string;
  content: string;
  suggestions: string[];
  created_at: string;
};

export function useCardDeepenings(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card-deepenings', cardId],
    enabled: !!cardId,
    queryFn: async (): Promise<CardDeepening[]> => {
      const { data, error } = await supabase
        .from('card_deepenings')
        .select('id, card_id, prompt, content, suggestions, created_at')
        .eq('card_id', cardId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CardDeepening[];
    },
  });
}

export function useDeepenCard(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (direction: string) => {
      const { data, error } = await supabase.functions.invoke<DeepenResponse>('deepen-card', {
        body: { card_id: cardId, direction },
      });
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-deepenings', cardId] });
    },
  });
}
