import Markdown from 'react-native-markdown-display';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
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
import { useSavedCards } from '@/src/features/cards/useSavedCards';
import type { Card, CardType } from '@/src/features/cards/types';
import { DomainTreeCard } from '@/src/features/topics/components/DomainTreeCard';
import { useKnowledgeTree, type StudiedTopic } from '@/src/features/topics/useKnowledgeTree';
import { useTopicCards } from '@/src/features/topics/useTopicCards';

const TYPE_LABEL: Record<CardType, string> = {
  concept: 'Concept',
  example: 'Example',
  best_practice: 'Best practice',
  pitfall: 'Pitfall',
  news: 'News',
};

type Tab = 'tree' | 'saved';

export default function Library() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const userId = session?.user.id;

  const [tab, setTab] = useState<Tab>('tree');
  const [activeTopic, setActiveTopic] = useState<StudiedTopic | null>(null);
  const [savedQuery, setSavedQuery] = useState('');

  const { data: tree, isLoading: treeLoading } = useKnowledgeTree(userId);
  const { data: saved, isLoading: savedLoading } = useSavedCards(userId);

  const totalTopics = tree?.reduce((sum, d) => sum + d.children.length, 0) ?? 0;
  const totalCards = tree?.reduce((sum, d) => sum + d.totalCards, 0) ?? 0;

  const filteredSaved = useMemo(() => {
    if (!saved) return [];
    if (!savedQuery.trim()) return saved;
    const q = savedQuery.trim().toLowerCase();
    return saved.filter((card) => card.title.toLowerCase().includes(q) || card.content.toLowerCase().includes(q));
  }, [saved, savedQuery]);

  const cardWidth = Dimensions.get('window').width - 64;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
      </View>

      <View style={styles.header}>
        <Text style={[styles.heading, { color: c.text }]}>Library</Text>
        {tab === 'tree' ? (
          <Text style={[styles.subtitle, { color: c.icon }]}>
            {totalTopics} topics across {tree?.length ?? 0} areas · {totalCards} cards
          </Text>
        ) : (
          <Text style={[styles.subtitle, { color: c.icon }]}>{saved?.length ?? 0} saved cards</Text>
        )}
      </View>

      <View style={styles.tabs}>
        <TabButton label="Tree" active={tab === 'tree'} onPress={() => setTab('tree')} c={c} />
        <TabButton label="Saved" active={tab === 'saved'} onPress={() => setTab('saved')} c={c} />
      </View>

      {tab === 'tree' ? (
        treeLoading ? (
          <Text style={[styles.empty, { color: c.icon }]}>Loading…</Text>
        ) : (tree ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: c.icon }]}>
            Your tree is bare. Generate cards in Today and topics will start branching out here.
          </Text>
        ) : (
          <FlatList
            data={tree}
            keyExtractor={(d) => d.root.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <DomainTreeCard domain={item} width={cardWidth} onPressTopic={setActiveTopic} />
            )}
          />
        )
      ) : (
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.search, { color: c.text, borderColor: c.icon }]}
            placeholder="Search saved cards"
            placeholderTextColor={c.icon}
            value={savedQuery}
            onChangeText={setSavedQuery}
          />
          {savedLoading ? (
            <Text style={[styles.empty, { color: c.icon }]}>Loading…</Text>
          ) : filteredSaved.length === 0 ? (
            <Text style={[styles.empty, { color: c.icon }]}>
              {saved?.length === 0
                ? 'No saved cards yet. Tap "Save" on cards in Today to keep them here.'
                : 'No matches.'}
            </Text>
          ) : (
            <FlatList
              data={filteredSaved}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => <SavedCardRow card={item} c={c} />}
            />
          )}
        </View>
      )}

      <TopicCardsSheet topic={activeTopic} onClose={() => setActiveTopic(null)} userId={userId} />
    </SafeAreaView>
  );
}

function TabButton({
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
        styles.tab,
        { borderBottomColor: active ? c.tint : 'transparent' },
      ]}>
      <Text style={{ color: active ? c.tint : c.icon, fontWeight: active ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

function SavedCardRow({ card, c }: { card: Card; c: { text: string; icon: string; tint: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded((v) => !v)} style={[styles.row, { borderColor: c.icon + '33' }]}>
      <Text style={[styles.rowType, { color: c.tint }]}>{TYPE_LABEL[card.card_type]}</Text>
      <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={expanded ? 0 : 2}>
        {card.title}
      </Text>
      {expanded ? <Text style={[styles.rowContent, { color: c.text }]}>{card.content}</Text> : null}
      <Text style={[styles.rowMeta, { color: c.icon }]}>
        {new Date(card.created_at).toLocaleDateString()} · {card.estimated_minutes} min
      </Text>
    </Pressable>
  );
}

function TopicCardsSheet({
  topic,
  userId,
  onClose,
}: {
  topic: StudiedTopic | null;
  userId: string | undefined;
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { data: cards, isLoading } = useTopicCards(userId, topic?.id ?? null);

  return (
    <Modal visible={!!topic} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: c.background }]}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{topic?.name ?? ''}</Text>
            <Text style={[styles.modalSubtitle, { color: c.icon }]}>
              {cards?.length ?? 0} cards on this topic
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: c.icon }]}>
            <Text style={{ color: c.text }}>Close</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <Text style={[styles.empty, { color: c.icon }]}>Loading…</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {(cards ?? []).map((card) => (
              <View key={card.id} style={[styles.row, { borderColor: c.icon + '33' }]}>
                <Text style={[styles.rowType, { color: c.tint }]}>{TYPE_LABEL[card.card_type]}</Text>
                <Text style={[styles.rowTitle, { color: c.text }]}>{card.title}</Text>
                <Markdown
                  style={{
                    body: { color: c.text, fontSize: 14, lineHeight: 20 },
                    code_inline: {
                      backgroundColor: scheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                      color: scheme === 'dark' ? '#e0e0e0' : '#1a1a1a',
                      fontFamily: 'Menlo',
                      fontSize: 12,
                    },
                    fence: {
                      backgroundColor: scheme === 'dark' ? '#1a1a1a' : '#f6f6f6',
                      color: scheme === 'dark' ? '#e0e0e0' : '#1a1a1a',
                      fontFamily: 'Menlo',
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 4,
                    },
                  }}>
                  {card.content}
                </Markdown>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 4 },
  heading: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 2 },
  search: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  empty: { textAlign: 'center', marginTop: 60, paddingHorizontal: 32, fontSize: 15 },
  list: { padding: 16, gap: 12 },
  row: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  rowType: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  rowTitle: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  rowContent: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  rowMeta: { fontSize: 12 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalSubtitle: { fontSize: 13 },
  closeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
