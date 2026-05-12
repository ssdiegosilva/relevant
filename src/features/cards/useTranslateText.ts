import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

type TranslateResponse = {
  translation: string;
  source_lang: string;
};

export function useTranslateText() {
  return useMutation({
    mutationFn: async ({ text, targetLang }: { text: string; targetLang: 'en' | 'pt' }) => {
      const { data, error } = await supabase.functions.invoke<TranslateResponse>('translate-text', {
        body: { text, target_lang: targetLang },
      });
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    },
  });
}
