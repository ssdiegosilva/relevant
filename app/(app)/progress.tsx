import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useProfile } from '@/src/features/auth/useProfile';
import { useAchievements, useUserAchievements } from '@/src/features/gamification/useAchievements';
import { useStreak } from '@/src/features/gamification/useStreak';
import { useTopicsStudied } from '@/src/features/topics/useTopicsStudied';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000];

function nextLevelXp(totalXp: number) {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXp < threshold) return threshold;
  }
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
}

export default function Progress() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const { data: streak } = useStreak(userId);
  const { data: topics } = useTopicsStudied(userId);
  const { data: achievements } = useAchievements();
  const { data: unlocked } = useUserAchievements(userId);

  const totalXp = profile?.total_xp ?? 0;
  const level = profile?.level ?? 1;
  const nextXp = nextLevelXp(totalXp);
  const prevXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const progress = nextXp > prevXp ? Math.min(1, (totalXp - prevXp) / (nextXp - prevXp)) : 0;

  const unlockedSet = new Set(unlocked?.map((u) => u.achievement_id) ?? []);
  const activeDays = streak?.active_days_this_week ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.heading, { color: c.text }]}>Progress</Text>

        <View style={[styles.card, { borderColor: c.icon + '33' }]}>
          <Text style={[styles.label, { color: c.icon }]}>Total XP</Text>
          <Text style={[styles.bigNumber, { color: c.tint }]}>{totalXp}</Text>
          <View style={[styles.progressTrack, { backgroundColor: c.icon + '22' }]}>
            <View style={[styles.progressFill, { backgroundColor: c.tint, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.muted, { color: c.icon }]}>
            Level {level} · {nextXp - totalXp} XP to next level
          </Text>
        </View>

        <View style={[styles.card, { borderColor: c.icon + '33' }]}>
          <Text style={[styles.label, { color: c.icon }]}>This week</Text>
          <Text style={[styles.bigNumber, { color: c.text }]}>{activeDays} of 7 days</Text>
          <View style={styles.daysRow}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dayDot,
                  { backgroundColor: i < activeDays ? c.tint : c.icon + '33' },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.muted, { color: c.icon }]}>
            Streak: {streak?.current_streak ?? 0} {streak?.current_streak === 1 ? 'week' : 'weeks'} · Best:{' '}
            {streak?.longest_streak ?? 0}
          </Text>
        </View>

        <View style={[styles.card, { borderColor: c.icon + '33' }]}>
          <Text style={[styles.label, { color: c.icon }]}>Topics explored</Text>
          <Text style={[styles.bigNumber, { color: c.text }]}>{topics?.length ?? 0}</Text>
          {(topics ?? []).slice(0, 8).map((t) => (
            <View key={t.id} style={styles.topicRow}>
              <Text style={[styles.topicName, { color: c.text }]}>{t.name}</Text>
              <Text style={[styles.topicCount, { color: c.icon }]}>{t.card_count} cards</Text>
            </View>
          ))}
          {topics && topics.length > 8 ? (
            <Text style={[styles.muted, { color: c.icon }]}>+{topics.length - 8} more</Text>
          ) : null}
        </View>

        <View style={[styles.card, { borderColor: c.icon + '33' }]}>
          <Text style={[styles.label, { color: c.icon }]}>Achievements</Text>
          <Text style={[styles.bigNumber, { color: c.text }]}>
            {unlockedSet.size} / {achievements?.length ?? 0}
          </Text>
          <View style={styles.achievementsGrid}>
            {(achievements ?? []).map((a) => {
              const got = unlockedSet.has(a.id);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.achievement,
                    { borderColor: c.icon + '33', opacity: got ? 1 : 0.4 },
                  ]}>
                  <Text style={[styles.achName, { color: got ? c.tint : c.text }]}>{a.name}</Text>
                  <Text style={[styles.achDesc, { color: c.icon }]} numberOfLines={2}>
                    {a.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 6 },
  label: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  bigNumber: { fontSize: 36, fontWeight: '800' },
  muted: { fontSize: 13, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%' },
  daysRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dayDot: { flex: 1, height: 8, borderRadius: 4 },
  topicRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  topicName: { fontSize: 15 },
  topicCount: { fontSize: 13 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  achievement: { width: '48%', padding: 12, borderRadius: 10, borderWidth: 1, gap: 4 },
  achName: { fontSize: 13, fontWeight: '700' },
  achDesc: { fontSize: 11, lineHeight: 14 },
});
