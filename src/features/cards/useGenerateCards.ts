import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

import type { GenerateCardsResponse } from './types';

export type GenerationMode = 'challenge' | 'surprise' | 'side_brain';

export function useGenerateCards() {
  return useMutation({
    mutationFn: async ({
      description,
      context,
      mode = 'challenge',
    }: {
      description?: string;
      context?: string;
      mode?: GenerationMode;
    }) => {
      const { data, error } = await supabase.functions.invoke<GenerateCardsResponse>('generate-cards', {
        body: { description, context, mode, n_cards: 3 },
      });
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    },
  });
}
