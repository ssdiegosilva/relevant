import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useProfile } from '@/src/features/auth/useProfile';
import { EditInterestsModal } from '@/src/features/profile/EditInterestsModal';
import { useI18n, type Lang } from '@/src/lib/i18n';
import { supabase } from '@/src/lib/supabase';

export default function Profile() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { t, lang, setLang } = useI18n();
  const [editingInterests, setEditingInterests] = useState(false);

  const interests: string[] = profile?.interests ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: c.text }]}>{t('profile.heading')}</Text>
        <Field label={t('profile.email')} value={session?.user.email ?? '—'} c={c} />
        <Field label={t('profile.role')} value={profile?.role ?? '—'} c={c} />
        <Field
          label={t('profile.experience')}
          value={
            profile?.experience_years
              ? t('profile.experienceValue', { n: profile.experience_years })
              : '—'
          }
          c={c}
        />

        <Pressable onPress={() => setEditingInterests(true)} style={styles.editableField}>
          <View style={styles.editableHeader}>
            <Text style={[styles.fieldLabel, { color: c.icon }]}>{t('profile.interests')}</Text>
            <Text style={[styles.editLink, { color: c.tint }]}>{t('common.edit')}</Text>
          </View>
          <Text style={[styles.fieldValue, { color: c.text }]}>
            {interests.join(', ') || t('profile.tapEdit')}
          </Text>
        </Pressable>

        <View style={styles.editableField}>
          <Text style={[styles.fieldLabel, { color: c.icon }]}>{t('profile.language')}</Text>
          <View style={styles.langRow}>
            <LangChip
              active={lang === 'en'}
              label={t('lang.en')}
              onPress={() => setLang('en')}
              c={c}
            />
            <LangChip
              active={lang === 'pt'}
              label={t('lang.pt')}
              onPress={() => setLang('pt')}
              c={c}
            />
          </View>
        </View>

        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={[styles.signOut, { borderColor: c.icon }]}>
          <Text style={{ color: c.text }}>{t('profile.signOut')}</Text>
        </Pressable>
      </View>

      <EditInterestsModal
        visible={editingInterests}
        initial={interests}
        onClose={() => setEditingInterests(false)}
      />
    </SafeAreaView>
  );
}

function Field({ label, value, c }: { label: string; value: string; c: { text: string; icon: string } }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.icon }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function LangChip({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: { text: string; icon: string; tint: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.langChip,
        {
          borderColor: active ? c.tint : c.icon,
          backgroundColor: active ? c.tint + '22' : 'transparent',
        },
      ]}>
      <Text style={{ color: active ? c.tint : c.text, fontWeight: active ? '600' : '400' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  body: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  field: { gap: 4 },
  editableField: { gap: 8 },
  editableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: 14, fontWeight: '600' },
  fieldLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 17 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  signOut: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
