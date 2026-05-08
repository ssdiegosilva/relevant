import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useGenerateCards, type GenerationMode } from '@/src/features/cards/useGenerateCards';
import { SessionStudyView } from '@/src/features/sessions/SessionStudyView';
import { usePendingSessions, type PendingSession } from '@/src/features/sessions/usePendingSessions';

const LOADING_MESSAGES: Record<GenerationMode, string[]> = {
  challenge: [
    'Understanding your context…',
    'Finding the sharpest angles…',
    'Picking 3 cards worth your time…',
  ],
  surprise: [
    'Reading your trail so far…',
    'Looking one step ahead…',
    'Building cards on it…',
  ],
  side_brain: [
    'Stepping outside software…',
    'Hunting an idea worth borrowing…',
    'Wiring up the cards…',
  ],
};

export default function Today() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session: auth } = useAuth();
  const userId = auth?.user.id;
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<GenerationMode | 'queue' | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const generate = useGenerateCards();
  const pending = usePendingSessions(userId);

  useEffect(() => {
    if (!loadingMode) return;
    const messages =
      loadingMode === 'queue' ? ['Queuing your idea…', 'Generating cards…'] : LOADING_MESSAGES[loadingMode];
    let i = 0;
    setLoadingMsg(messages[0]);
    const id = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMsg(messages[i]);
    }, 2200);
    return () => clearInterval(id);
  }, [loadingMode]);

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
      Alert.alert('Tell us more', 'Describe your challenge in a sentence.');
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
      Alert.alert('Could not generate', e?.message ?? 'Try again in a moment.');
    }
  };

  const addToQueue = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Tell us more', 'Describe what you want to study in a sentence.');
      return;
    }
    setLoadingMode('queue');
    try {
      await generate.mutateAsync({ mode: 'challenge', description: description.trim() });
      queryClient.invalidateQueries({ queryKey: ['pending-sessions', userId] });
      setLoadingMode(null);
      setDescription('');
      setToast('Added to your queue');
    } catch (e: any) {
      setLoadingMode(null);
      Alert.alert('Could not queue', e?.message ?? 'Try again in a moment.');
    }
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
        {queue.length > 0 ? (
          <View style={[styles.queueBadge, { backgroundColor: c.tint }]}>
            <Text style={styles.queueBadgeText}>{queue.length}</Text>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: c.text }]}>Today</Text>

          {queue.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.sectionLabel, { color: c.icon }]}>Your queue</Text>
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

          <View style={{ gap: 12, marginTop: queue.length > 0 ? 12 : 0 }}>
            <Text style={[styles.sectionLabel, { color: c.icon }]}>
              {queue.length > 0 ? 'Add another idea' : "What's on your mind?"}
            </Text>
            <TextInput
              style={[styles.textArea, { color: c.text, borderColor: c.icon }]}
              placeholder="e.g., Implementing rate limiting in Express, never used Redis"
              placeholderTextColor={c.icon}
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.queueButton, { borderColor: c.tint }]}
                onPress={addToQueue}>
                <Text style={[styles.queueButtonText, { color: c.tint }]}>📥 Add to queue</Text>
              </Pressable>
              <Pressable
                style={[styles.studyButton, { backgroundColor: c.tint }]}
                onPress={() => studyNow('challenge')}>
                <Text style={styles.studyButtonText}>Study now →</Text>
              </Pressable>
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: c.icon + '33' }]} />
              <Text style={[styles.dividerText, { color: c.icon }]}>or let me pick</Text>
              <View style={[styles.dividerLine, { backgroundColor: c.icon + '33' }]} />
            </View>

            <View style={styles.altRow}>
              <Pressable
                style={[styles.altButton, { borderColor: c.tint }]}
                onPress={() => studyNow('surprise')}>
                <Text style={[styles.altLabel, { color: c.tint }]}>✨ Surprise me</Text>
                <Text style={[styles.altHint, { color: c.icon }]}>Next on my trail</Text>
              </Pressable>
              <Pressable
                style={[styles.altButton, { borderColor: '#A855F7' }]}
                onPress={() => studyNow('side_brain')}>
                <Text style={[styles.altLabel, { color: '#A855F7' }]}>🧠 Side brain</Text>
                <Text style={[styles.altHint, { color: c.icon }]}>Outside software</Text>
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
  c: { text: string; icon: string; tint: string };
}) {
  const acted = item.acted_count;
  const total = item.card_count;
  const remaining = total - acted;
  return (
    <Pressable onPress={onPress} style={[styles.queueItem, { borderColor: c.icon + '33' }]}>
      <Text style={[styles.queueItemTitle, { color: c.text }]} numberOfLines={2}>
        {item.challenge_description}
      </Text>
      <View style={styles.queueItemMeta}>
        <Text style={[styles.queueItemRemaining, { color: c.tint }]}>
          {remaining > 0 ? `${remaining} card${remaining === 1 ? '' : 's'} to study` : 'Ready'}
        </Text>
        <Text style={[styles.queueItemTime, { color: c.icon }]}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
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
