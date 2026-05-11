import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { CardCarousel } from '@/src/features/cards/components/CardCarousel';
import { useCardAction, useRemoveCardAction } from '@/src/features/cards/useCardAction';
import type { Card } from '@/src/features/cards/types';
import { useI18n } from '@/src/lib/i18n';

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
  const { t } = useI18n();

  const { data, isLoading } = useSession(sessionId, userId);
  const action = useCardAction();
  const removeAction = useRemoveCardAction();
  const [finishing, setFinishing] = useState(false);

  const cards: Card[] = data?.cards ?? [];
  const interactions = data?.interactions ?? [];

  const studiedIds = useMemo(
    () => new Set(interactions.filter((i) => i.action === 'studied').map((i) => i.card_id)),
    [interactions],
  );
  const favoritedIds = useMemo(
    () => new Set(interactions.filter((i) => i.action === 'saved').map((i) => i.card_id)),
    [interactions],
  );

  const allStudied = cards.length > 0 && cards.every((card) => studiedIds.has(card.id));

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['pending-sessions', userId] });
    queryClient.invalidateQueries({ queryKey: ['knowledge-tree', userId] });
    queryClient.invalidateQueries({ queryKey: ['saved-cards', userId] });
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  };

  const toggleFavorite = (cardId: string) => {
    const isActive = favoritedIds.has(cardId);
    const fn = isActive ? removeAction : action;
    fn.mutate(
      { cardId, action: 'saved' },
      { onSuccess: invalidateAll },
    );
  };

  const finishSession = async () => {
    const toStudy = cards.filter((card) => !studiedIds.has(card.id));
    if (toStudy.length === 0) {
      invalidateAll();
      return;
    }
    setFinishing(true);
    try {
      await Promise.all(
        toStudy.map((card) => action.mutateAsync({ cardId: card.id, action: 'studied' })),
      );
      invalidateAll();
    } catch (e: any) {
      Alert.alert('Could not finish', e?.message ?? t('common.tryAgain'));
    } finally {
      setFinishing(false);
    }
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

  if (allStudied) {
    const studiedCount = studiedIds.size;
    const favoritedCount = favoritedIds.size;
    const xp = studiedCount * 10;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.summary}>
          <Text style={[styles.heading, { color: c.text }]}>{t('session.niceWork')}</Text>
          <Text style={[styles.summaryStat, { color: c.tint }]}>{t('session.xp', { xp })}</Text>
          <Text style={[styles.subtitle, { color: c.icon }]}>
            {t('session.summary', { studied: studiedCount, favorited: favoritedCount })}
          </Text>
          <Pressable style={[styles.button, { backgroundColor: c.tint, marginTop: 24 }]} onPress={onClose}>
            <Text style={styles.buttonText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: c.icon }]}>
          <Text style={{ color: c.text }}>← {t('common.back')}</Text>
        </Pressable>
      </View>
      <CardCarousel
        cards={cards}
        favoritedIds={favoritedIds}
        finishing={finishing}
        onFavorite={(card) => toggleFavorite(card.id)}
        onFinish={finishSession}
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
