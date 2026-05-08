import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { supabase } from '@/src/lib/supabase';

export default function Login() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const { error } = mode === 'sign-up'
      ? await supabase.auth.signUp({ email: trimmedEmail, password })
      : await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    setLoading(false);
    if (error) {
      Alert.alert(mode === 'sign-up' ? 'Sign up failed' : 'Sign in failed', error.message);
      return;
    }
    if (mode === 'sign-up') {
      Alert.alert(
        'Account created',
        'If email confirmation is enabled, check your inbox. Otherwise you are signed in.',
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <Logo variant="stacked" size={44} />
        </View>
        <Text style={[styles.subtitle, { color: c.icon }]}>Daily, contextual learning for builders.</Text>

        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.icon }]}
          placeholder="you@email.com"
          placeholderTextColor={c.icon}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextInput
          style={[styles.input, { color: c.text, borderColor: c.icon }]}
          placeholder="password (min 6 chars)"
          placeholderTextColor={c.icon}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Pressable
          style={[styles.button, { backgroundColor: c.tint, opacity: loading ? 0.6 : 1 }]}
          onPress={submit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'sign-up' ? 'Create account' : 'Sign in'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}
          style={styles.linkButton}
          disabled={loading}>
          <Text style={[styles.linkText, { color: c.tint }]}>
            {mode === 'sign-up' ? 'Already have an account? Sign in' : "New here? Create an account"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  brand: { alignItems: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { padding: 8, alignItems: 'center' },
  linkText: { fontSize: 14 },
});
