import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { supabase } from '@/src/lib/supabase';

import type { CardAction } from './types';

export function useCardAction() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      action,
      rating,
      timeSpentSec,
    }: {
      cardId: string;
      action: CardAction;
      rating?: number;
      timeSpentSec?: number;
    }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('No session');
      const { error } = await supabase.from('card_interactions').insert({
        user_id: userId,
        card_id: cardId,
        action,
        rating: rating ?? null,
        time_spent_sec: timeSpentSec ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      if (vars.action === 'studied' || vars.action === 'deepened') {
        queryClient.invalidateQueries({ queryKey: ['profile', session?.user.id] });
        queryClient.invalidateQueries({ queryKey: ['streak', session?.user.id] });
      }
      if (vars.action === 'saved') {
        queryClient.invalidateQueries({ queryKey: ['saved-cards', session?.user.id] });
      }
    },
  });
}
