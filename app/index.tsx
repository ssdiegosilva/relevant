import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { useProfile } from '@/src/features/auth/useProfile';

export default function Index() {
  const { session, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user.id);

  if (loading || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile?.onboarded_at) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(app)/today" />;
}
