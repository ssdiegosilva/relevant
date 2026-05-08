import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { CardCarousel } from '@/src/features/cards/components/CardCarousel';
import { useCardAction } from '@/src/features/cards/useCardAction';
import type { Card } from '@/src/features/cards/types';

import { useSession } from './useSession';

export function SessionStudyView({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session: auth } = useAuth();
  const userId = auth?.user.id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useSession(sessionId, userId);
  const action = useCardAction();

  const cards: Card[] = data?.cards ?? [];
  const interactions = data?.interactions ?? [];

  const studiedIds = useMemo(
    () => new Set(interactions.filter((i) => i.action === 'studied').map((i) => i.card_id)),
    [interactions],
  );
  const savedIds = useMemo(
    () => new Set(interactions.filter((i) => i.action === 'saved').map((i) => i.card_id)),
    [interactions],
  );
  const skippedIds = useMemo(
    () => new Set(interactions.filter((i) => i.action === 'skipped').map((i) => i.card_id)),
    [interactions],
  );

  const allActed =
    cards.length > 0 && cards.every((card) => studiedIds.has(card.id) || savedIds.has(card.id) || skippedIds.has(card.id));

  const trigger = (cardId: string, act: 'studied' | 'saved' | 'skipped') => {
    action.mutate(
      { cardId, action: act },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['pending-sessions', userId] });
          queryClient.invalidateQueries({ queryKey: ['knowledge-tree', userId] });
          queryClient.invalidateQueries({ queryKey: ['saved-cards', userId] });
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={c.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (allActed) {
    const studiedCount = studiedIds.size;
    const savedCount = savedIds.size;
    const xp = studiedCount * 10 + (studiedCount >= 3 ? 20 : 0) + 10;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.summary}>
          <Text style={[styles.heading, { color: c.text }]}>Nice work</Text>
          <Text style={[styles.summaryStat, { color: c.tint }]}>+{xp} XP</Text>
          <Text style={[styles.subtitle, { color: c.icon }]}>
            Studied {studiedCount} · Saved {savedCount}
          </Text>
          <Pressable style={[styles.button, { backgroundColor: c.tint, marginTop: 24 }]} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: c.icon }]}>
          <Text style={{ color: c.text }}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerCount, { color: c.icon }]}>
          {studiedIds.size + savedIds.size + skippedIds.size} of {cards.length}
        </Text>
      </View>
      <CardCarousel
        cards={cards}
        studiedIds={studiedIds}
        savedIds={savedIds}
        skippedIds={skippedIds}
        onStudied={(card) => trigger(card.id, 'studied')}
        onSave={(card) => trigger(card.id, 'saved')}
        onSkip={(card) => trigger(card.id, 'skipped')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  headerCount: { fontSize: 13 },
  heading: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16 },
  summary: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  summaryStat: { fontSize: 56, fontWeight: '800' },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
