import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useGenerateCards, type GenerationMode } from '@/src/features/cards/useGenerateCards';
import { SessionStudyView } from '@/src/features/sessions/SessionStudyView';
import { usePendingSessions, type PendingSession } from '@/src/features/sessions/usePendingSessions';
import { useArchiveSession, useDeleteSession } from '@/src/features/sessions/useSessionMutations';
import { useI18n } from '@/src/lib/i18n';
import type { StringKey } from '@/src/lib/strings';

const LOADING_KEYS: Record<GenerationMode, StringKey[]> = {
  challenge: ['today.loading.challenge.1', 'today.loading.challenge.2', 'today.loading.challenge.3'],
  surprise: ['today.loading.surprise.1', 'today.loading.surprise.2', 'today.loading.surprise.3'],
  side_brain: ['today.loading.sideBrain.1', 'today.loading.sideBrain.2', 'today.loading.sideBrain.3'],
};

type BuildingItem = {
  localId: string;
  description: string;
  createdAt: string;
};

export default function Today() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session: auth } = useAuth();
  const userId = auth?.user.id;
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [description, setDescription] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<GenerationMode | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [building, setBuilding] = useState<BuildingItem[]>([]);

  const generate = useGenerateCards();
  const pending = usePendingSessions(userId);

  useEffect(() => {
    if (!loadingMode) return;
    const keys = LOADING_KEYS[loadingMode];
    let i = 0;
    setLoadingMsg(t(keys[0]));
    const id = setInterval(() => {
      i = (i + 1) % keys.length;
      setLoadingMsg(t(keys[i]));
    }, 2200);
    return () => clearInterval(id);
  }, [loadingMode, t]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  if (activeSessionId) {
    return <SessionStudyView sessionId={activeSessionId} onClose={() => setActiveSessionId(null)} />;
  }

  const studyNow = async (mode: GenerationMode) => {
    if (mode === 'challenge' && description.trim().length < 5) {
      Alert.alert(t('today.tellMore.title'), t('today.tellMore.bodyChallenge'));
      return;
    }
    setLoadingMode(mode);
    try {
      const data = await generate.mutateAsync({
        mode,
        description: mode === 'challenge' ? description.trim() : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-sessions', userId] });
      setLoadingMode(null);
      setActiveSessionId(data.session_id);
      if (mode === 'challenge') setDescription('');
    } catch (e: any) {
      setLoadingMode(null);
      Alert.alert(t('today.couldNotGenerate'), e?.message ?? t('common.tryAgain'));
    }
  };

  const addToQueue = () => {
    const desc = description.trim();
    if (desc.length < 5) {
      Alert.alert(t('today.tellMore.title'), t('today.tellMore.bodyQueue'));
      return;
    }
    const localId = `building-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setBuilding((prev) => [
      { localId, description: desc, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setDescription('');
    setToast(t('today.toastBuilding'));

    generate
      .mutateAsync({ mode: 'challenge', description: desc })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ['pending-sessions', userId] });
      })
      .catch((e: any) => {
        Alert.alert(t('today.couldNotQueue'), e?.message ?? t('common.tryAgain'));
      })
      .finally(() => {
        setBuilding((prev) => prev.filter((b) => b.localId !== localId));
      });
  };

  if (loadingMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.tint} />
          <Text style={[styles.loadingMsg, { color: c.icon }]}>{loadingMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const queue = pending.data ?? [];
  const totalQueueCount = queue.length + building.length;
  const hasAnyQueue = totalQueueCount > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
        {hasAnyQueue ? (
          <View style={[styles.queueBadge, { backgroundColor: c.tint }]}>
            <Text style={styles.queueBadgeText}>{totalQueueCount}</Text>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: c.text }]}>{t('today.heading')}</Text>

          {hasAnyQueue ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.sectionLabel, { color: c.icon }]}>{t('today.yourQueue')}</Text>
              {building.map((b) => (
                <BuildingQueueItem key={b.localId} item={b} c={c} />
              ))}
              {queue.map((item) => (
                <QueueItem
                  key={item.id}
                  item={item}
                  onPress={() => setActiveSessionId(item.id)}
                  c={c}
                />
              ))}
            </View>
          ) : null}

          <View style={{ gap: 12, marginTop: hasAnyQueue ? 12 : 0 }}>
            <Text style={[styles.sectionLabel, { color: c.icon }]}>
              {hasAnyQueue ? t('today.addAnother') : t('today.whatsOnMind')}
            </Text>
            <TextInput
              style={[styles.textArea, { color: c.text, borderColor: c.icon }]}
              placeholder={t('today.placeholder')}
              placeholderTextColor={c.icon}
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.queueButton, { borderColor: c.tint }]}
                onPress={addToQueue}>
                <Text style={[styles.queueButtonText, { color: c.tint }]}>{t('today.addToQueue')}</Text>
              </Pressable>
              <Pressable
                style={[styles.studyButton, { backgroundColor: c.tint }]}
                onPress={() => studyNow('challenge')}>
                <Text style={styles.studyButtonText}>{t('today.studyNow')}</Text>
              </Pressable>
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: c.icon + '33' }]} />
              <Text style={[styles.dividerText, { color: c.icon }]}>{t('today.orLetMePick')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: c.icon + '33' }]} />
            </View>

            <View style={styles.altRow}>
              <Pressable
                style={[styles.altButton, { borderColor: c.tint }]}
                onPress={() => studyNow('surprise')}>
                <Text style={[styles.altLabel, { color: c.tint }]}>{t('today.surpriseMe')}</Text>
                <Text style={[styles.altHint, { color: c.icon }]}>{t('today.surpriseHint')}</Text>
              </Pressable>
              <Pressable
                style={[styles.altButton, { borderColor: '#A855F7' }]}
                onPress={() => studyNow('side_brain')}>
                <Text style={[styles.altLabel, { color: '#A855F7' }]}>{t('today.sideBrain')}</Text>
                <Text style={[styles.altHint, { color: c.icon }]}>{t('today.sideBrainHint')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {toast ? (
        <View style={[styles.toast, { backgroundColor: c.tint }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function QueueItem({
  item,
  onPress,
  c,
}: {
  item: PendingSession;
  onPress: () => void;
  c: { text: string; icon: string; tint: string; background: string };
}) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const archive = useArchiveSession();
  const del = useDeleteSession();
  const { t } = useI18n();

  const studied = item.studied_count;
  const total = item.card_count;
  const remaining = total - studied;

  const onArchive = () => {
    swipeRef.current?.close();
    archive.mutate(item.id);
  };

  const onDelete = () => {
    swipeRef.current?.close();
    Alert.alert(
      t('queue.deleteTitle'),
      t('queue.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => del.mutate(item.id) },
      ],
    );
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={48}
      rightThreshold={48}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <Pressable onPress={onArchive} style={[styles.swipeAction, { backgroundColor: c.icon }]}>
          <Text style={styles.swipeActionText}>{t('common.archive')}</Text>
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable onPress={onDelete} style={[styles.swipeAction, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.swipeActionText}>{t('common.delete')}</Text>
        </Pressable>
      )}
      containerStyle={styles.swipeContainer}>
      <Pressable
        onPress={onPress}
        style={[
          styles.queueItem,
          { borderColor: c.icon + '33', backgroundColor: c.background },
        ]}>
        <Text style={[styles.queueItemTitle, { color: c.text }]} numberOfLines={2}>
          {item.challenge_description}
        </Text>
        <View style={styles.queueItemMeta}>
          <Text style={[styles.queueItemRemaining, { color: c.tint }]}>
            {remaining > 0
              ? remaining === 1
                ? t('today.cardToStudy')
                : t('today.cardsToStudy', { n: remaining })
              : t('today.ready')}
          </Text>
          <Text style={[styles.queueItemTime, { color: c.icon }]}>
            {timeAgo(item.created_at, t)}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

function BuildingQueueItem({
  item,
  c,
}: {
  item: BuildingItem;
  c: { text: string; icon: string; tint: string };
}) {
  const { t } = useI18n();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.queueItem,
        { borderColor: c.tint + '33', backgroundColor: c.tint + '15' },
      ]}>
      <Text style={[styles.queueItemTitle, { color: c.text }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.queueItemMeta}>
        <View style={styles.buildingRow}>
          <ActivityIndicator size="small" color={c.tint} />
          <Text style={[styles.queueItemRemaining, { color: c.tint }]}>{t('today.buildingCards')}</Text>
        </View>
        <Text style={[styles.queueItemTime, { color: c.icon }]}>{t('common.justNow')}</Text>
      </View>
    </View>
  );
}

function timeAgo(iso: string, t: (k: StringKey, vars?: Record<string, string | number>) => string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return t('common.justNow');
  if (min < 60) return t('common.minAgo', { m: min });
  const h = Math.round(min / 60);
  if (h < 24) return t('common.hAgo', { h });
  return t('common.dAgo', { d: Math.round(h / 24) });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  queueBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 24, gap: 16 },
  heading: { fontSize: 32, fontWeight: '800' },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  queueItem: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  queueItemTitle: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  queueItemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueItemRemaining: { fontSize: 12, fontWeight: '700' },
  queueItemTime: { fontSize: 12 },
  buildingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swipeContainer: { borderRadius: 12, overflow: 'hidden' },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minWidth: 96,
  },
  swipeActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  queueButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  queueButtonText: { fontSize: 14, fontWeight: '600' },
  studyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  studyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  altRow: { flexDirection: 'row', gap: 8 },
  altButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  altLabel: { fontSize: 15, fontWeight: '700' },
  altHint: { fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  loadingMsg: { fontSize: 15, textAlign: 'center' },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
