import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
};

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase.from('achievements').select('*').order('xp_reward');
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });
}

export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []) as { achievement_id: string; unlocked_at: string }[];
    },
  });
}
