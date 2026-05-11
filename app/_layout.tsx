import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/features/auth/AuthProvider';
import { useProfile } from '@/src/features/auth/useProfile';
import { I18nProvider } from '@/src/lib/i18n';
import { queryClient } from '@/src/lib/query-client';
import { initSentry } from '@/src/lib/sentry';

initSentry();

export const unstable_settings = {
  anchor: '(app)/today',
};

function AuthGate() {
  const { session, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user.id);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (session && profileLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const route = segs[1];

    if (!session) {
      if (!(inAuthGroup && route === 'login')) router.replace('/(auth)/login');
      return;
    }

    const onboarded = !!profile?.onboarded_at;
    if (!onboarded) {
      if (!(inAuthGroup && route === 'onboarding')) router.replace('/(auth)/onboarding');
      return;
    }

    if (inAuthGroup) router.replace('/(app)/today');
  }, [session, loading, profile, profileLoading, segments, router]);

  if (loading || (session && profileLoading && !profile)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGate />
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
