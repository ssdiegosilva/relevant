import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useProfile } from '@/src/features/auth/useProfile';
import { supabase } from '@/src/lib/supabase';

export default function Profile() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: c.text }]}>Profile</Text>
        <Field label="Email" value={session?.user.email ?? '—'} c={c} />
        <Field label="Role" value={profile?.role ?? '—'} c={c} />
        <Field label="Experience" value={profile?.experience_years ? `${profile.experience_years} yrs` : '—'} c={c} />
        <Field label="Interests" value={(profile?.interests ?? []).join(', ') || '—'} c={c} />

        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={[styles.signOut, { borderColor: c.icon }]}>
          <Text style={{ color: c.text }}>Sign out</Text>
        </Pressable>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  body: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 17 },
  signOut: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
