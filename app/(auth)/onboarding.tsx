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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  MACRO_CATEGORIES,
  MAX_INTERESTS,
  macroAllInterests,
} from '@/src/features/profile/constants';
import { useI18n } from '@/src/lib/i18n';
import type { StringKey } from '@/src/lib/strings';
import { supabase } from '@/src/lib/supabase';

const ROLES: { value: string; key: StringKey }[] = [
  { value: 'Backend dev', key: 'role.backend' },
  { value: 'Frontend dev', key: 'role.frontend' },
  { value: 'Fullstack', key: 'role.fullstack' },
  { value: 'Mobile dev', key: 'role.mobile' },
  { value: 'Data engineer', key: 'role.data' },
  { value: 'DevOps / SRE', key: 'role.devops' },
  { value: 'ML engineer', key: 'role.ml' },
  { value: 'Tech lead', key: 'role.lead' },
];

const EXPERIENCE: { key: StringKey; value: number }[] = [
  { key: 'exp.0-2', value: 1 },
  { key: 'exp.3-5', value: 4 },
  { key: 'exp.6-10', value: 8 },
  { key: 'exp.10plus', value: 12 },
];

const TIMES = ['08:00', '12:00', '18:00', '20:00', '22:00'];

export default function Onboarding() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>('');
  const [years, setYears] = useState<number>(4);
  const [interests, setInterests] = useState<string[]>([]);
  const [expandedCat, setExpandedCat] = useState<Record<string, boolean>>({});
  const [goals, setGoals] = useState('');
  const [studyTime, setStudyTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  const total = 5;
  const userId = session?.user.id;

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= MAX_INTERESTS ? prev : [...prev, i],
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
      Alert.alert(t('onb.couldNotSaveProfile'), pErr.message);
      return;
    }
    const { error: sErr } = await supabase
      .from('user_settings')
      .update({ preferred_study_time: studyTime })
      .eq('user_id', userId);
    setSaving(false);
    if (sErr) {
      Alert.alert(t('onb.couldNotSaveSettings'), sErr.message);
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
          <Step title={t('onb.role.title')} subtitle={t('onb.role.subtitle')} c={c}>
            {ROLES.map((r) => (
              <Chip
                key={r.value}
                label={t(r.key)}
                active={role === r.value}
                onPress={() => setRole(r.value)}
                c={c}
              />
            ))}
          </Step>
        )}
        {step === 1 && (
          <Step title={t('onb.exp.title')} subtitle={t('onb.exp.subtitle')} c={c}>
            {EXPERIENCE.map((e) => (
              <Chip
                key={e.value}
                label={t(e.key)}
                active={years === e.value}
                onPress={() => setYears(e.value)}
                c={c}
              />
            ))}
          </Step>
        )}
        {step === 2 && (
          <View style={{ gap: 8 }}>
            <Text style={[styles.title, { color: c.text }]}>{t('onb.interests.title')}</Text>
            <Text style={[styles.subtitle, { color: c.icon }]}>
              {t('onb.interests.subtitle', { max: MAX_INTERESTS })}
            </Text>
            <View style={{ gap: 12, marginTop: 16 }}>
              {MACRO_CATEGORIES.map((cat) => {
                const isOpen = !!expandedCat[cat.id];
                const count = macroAllInterests(cat).filter((i) => interests.includes(i)).length;
                return (
                  <View
                    key={cat.id}
                    style={[styles.categoryCard, { borderColor: c.icon + '33' }]}>
                    <Pressable
                      onPress={() =>
                        setExpandedCat((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                      }
                      style={styles.categoryHeader}>
                      <View style={styles.categoryHeaderLeft}>
                        <View style={[styles.iconBubble, { backgroundColor: c.tint + '1A' }]}>
                          <MaterialCommunityIcons
                            name={cat.icon as any}
                            size={22}
                            color={c.tint}
                          />
                        </View>
                        <Text style={[styles.categoryName, { color: c.text }]}>
                          {cat.name}
                        </Text>
                      </View>
                      <View style={styles.categoryHeaderRight}>
                        {count > 0 ? (
                          <View style={[styles.countBadge, { backgroundColor: c.tint }]}>
                            <Text style={styles.countBadgeText}>{count}</Text>
                          </View>
                        ) : null}
                        <MaterialCommunityIcons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={22}
                          color={c.icon}
                        />
                      </View>
                    </Pressable>
                    {isOpen ? (
                      <View style={styles.groupsContainer}>
                        {cat.groups.map((group) => (
                          <View key={group.name} style={styles.subGroup}>
                            <Text style={[styles.subGroupLabel, { color: c.icon }]}>
                              {group.name}
                            </Text>
                            <View style={styles.chipRow}>
                              {group.interests.map((i) => (
                                <Chip
                                  key={i}
                                  label={i}
                                  active={interests.includes(i)}
                                  onPress={() => toggleInterest(i)}
                                  c={c}
                                />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <Text style={[styles.count, { color: c.icon }]}>
              {t('interests.selected', { n: interests.length, max: MAX_INTERESTS })}
            </Text>
          </View>
        )}
        {step === 3 && (
          <Step title={t('onb.goal.title')} subtitle={t('onb.goal.subtitle')} c={c}>
            <TextInput
              style={[styles.textArea, { color: c.text, borderColor: c.icon }]}
              placeholder={t('onb.goal.placeholder')}
              placeholderTextColor={c.icon}
              multiline
              value={goals}
              onChangeText={setGoals}
            />
          </Step>
        )}
        {step === 4 && (
          <Step title={t('onb.time.title')} subtitle={t('onb.time.subtitle')} c={c}>
            {TIMES.map((time) => (
              <Chip key={time} label={time} active={studyTime === time} onPress={() => setStudyTime(time)} c={c} />
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
            <Text style={styles.buttonText}>{step === total - 1 ? t('onb.finish') : t('onb.continue')}</Text>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  count: { fontSize: 13, textAlign: 'center', marginTop: 16 },
  groupsContainer: { marginTop: 12, gap: 14 },
  subGroup: { gap: 4 },
  subGroupLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  categoryCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontSize: 16, fontWeight: '600' },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 110, fontSize: 16, marginTop: 16 },
  footer: { padding: 16, paddingBottom: 32 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
