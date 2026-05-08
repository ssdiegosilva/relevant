import { useQueryClient } from '@tanstack/react-query';
import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { supabase } from '@/src/lib/supabase';

const ROLES = ['Backend dev', 'Frontend dev', 'Fullstack', 'Mobile dev', 'Data engineer', 'DevOps / SRE', 'ML engineer', 'Tech lead'];

const INTERESTS = [
  'Frontend',
  'Backend',
  'DevOps',
  'AI / ML',
  'Mobile',
  'Data',
  'Security',
  'Architecture',
  'Cloud',
  'Databases',
  'Performance',
  'Testing',
];

const EXPERIENCE = [
  { label: '0-2 yrs', value: 1 },
  { label: '3-5 yrs', value: 4 },
  { label: '6-10 yrs', value: 8 },
  { label: '10+ yrs', value: 12 },
];

const TIMES = ['08:00', '12:00', '18:00', '20:00', '22:00'];

export default function Onboarding() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>('');
  const [years, setYears] = useState<number>(4);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [studyTime, setStudyTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  const total = 5;
  const userId = session?.user.id;

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 5 ? prev : [...prev, i],
    );
  };

  const next = async () => {
    if (step < total - 1) {
      setStep(step + 1);
      return;
    }
    if (!userId) return;
    setSaving(true);
    const tz = Localization.getCalendars()[0]?.timeZone ?? 'America/Sao_Paulo';
    const { error: pErr } = await supabase
      .from('profiles')
      .update({
        role,
        experience_years: years,
        interests,
        goals,
        timezone: tz,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (pErr) {
      setSaving(false);
      Alert.alert('Could not save profile', pErr.message);
      return;
    }
    const { error: sErr } = await supabase
      .from('user_settings')
      .update({ preferred_study_time: studyTime })
      .eq('user_id', userId);
    setSaving(false);
    if (sErr) {
      Alert.alert('Could not save settings', sErr.message);
      return;
    }
    await queryClient.refetchQueries({ queryKey: ['profile', userId] });
    router.replace('/(app)/today');
  };

  const canAdvance =
    (step === 0 && role.length > 0) ||
    (step === 1 && years > 0) ||
    (step === 2 && interests.length >= 1) ||
    (step === 3 && goals.trim().length >= 5) ||
    step === 4;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: i <= step ? c.tint : c.icon, opacity: i <= step ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {step === 0 && (
          <Step title="What's your role?" subtitle="Pick the closest match." c={c}>
            {ROLES.map((r) => (
              <Chip key={r} label={r} active={role === r} onPress={() => setRole(r)} c={c} />
            ))}
          </Step>
        )}
        {step === 1 && (
          <Step title="Years of experience" subtitle="Cards will adjust to your level." c={c}>
            {EXPERIENCE.map((e) => (
              <Chip key={e.value} label={e.label} active={years === e.value} onPress={() => setYears(e.value)} c={c} />
            ))}
          </Step>
        )}
        {step === 2 && (
          <Step title="Top interests" subtitle="Pick up to 5." c={c}>
            {INTERESTS.map((i) => (
              <Chip key={i} label={i} active={interests.includes(i)} onPress={() => toggleInterest(i)} c={c} />
            ))}
          </Step>
        )}
        {step === 3 && (
          <Step title="Your goal" subtitle="One sentence — what do you want to grow into?" c={c}>
            <TextInput
              style={[styles.textArea, { color: c.text, borderColor: c.icon }]}
              placeholder="e.g., be ready for a tech lead role in 2 years"
              placeholderTextColor={c.icon}
              multiline
              value={goals}
              onChangeText={setGoals}
            />
          </Step>
        )}
        {step === 4 && (
          <Step title="When do you study?" subtitle="We'll send a gentle reminder around then." c={c}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} active={studyTime === t} onPress={() => setStudyTime(t)} c={c} />
            ))}
          </Step>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, { backgroundColor: c.tint, opacity: !canAdvance || saving ? 0.5 : 1 }]}
          onPress={next}
          disabled={!canAdvance || saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{step === total - 1 ? 'Finish' : 'Continue'}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Step({
  title,
  subtitle,
  c,
  children,
}: {
  title: string;
  subtitle: string;
  c: { text: string; icon: string };
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.icon }]}>{subtitle}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: { text: string; tint: string; icon: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? c.tint : c.icon,
          backgroundColor: active ? c.tint + '22' : 'transparent',
        },
      ]}>
      <Text style={{ color: active ? c.tint : c.text, fontWeight: active ? '600' : '400' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: { flexDirection: 'row', gap: 8, padding: 16, justifyContent: 'center' },
  progressDot: { width: 32, height: 4, borderRadius: 2 },
  body: { padding: 24, paddingBottom: 96 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 110, fontSize: 16, marginTop: 16 },
  footer: { padding: 16, paddingBottom: 32 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
