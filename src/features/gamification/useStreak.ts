import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export function useStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ['streak', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
