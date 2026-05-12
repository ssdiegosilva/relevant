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
import { CardDetailModal } from '@/src/features/cards/components/CardDetailModal';
import { useArchivedCards } from '@/src/features/cards/useArchivedCards';
import { useSavedCards } from '@/src/features/cards/useSavedCards';
import type { Card, CardType } from '@/src/features/cards/types';
import { DomainTreeCard } from '@/src/features/topics/components/DomainTreeCard';
import { useKnowledgeTree, type StudiedTopic } from '@/src/features/topics/useKnowledgeTree';
import { useTopicCards } from '@/src/features/topics/useTopicCards';
import { useI18n } from '@/src/lib/i18n';
import type { StringKey } from '@/src/lib/strings';

const TYPE_KEY: Record<CardType, StringKey> = {
  concept: 'cardType.concept',
  example: 'cardType.example',
  best_practice: 'cardType.best_practice',
  pitfall: 'cardType.pitfall',
  news: 'cardType.news',
};

const TYPE_COLOR: Record<CardType, string> = {
  concept: '#3478F6',
  example: '#34C759',
  best_practice: '#5856D6',
  pitfall: '#FF9500',
  news: '#FF3B30',
};

type Tab = 'tree' | 'favorites' | 'archived';

export default function Library() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useI18n();

  const [tab, setTab] = useState<Tab>('tree');
  const [activeTopic, setActiveTopic] = useState<StudiedTopic | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [favoritesQuery, setFavoritesQuery] = useState('');
  const [archivedQuery, setArchivedQuery] = useState('');

  const { data: tree, isLoading: treeLoading } = useKnowledgeTree(userId);
  const { data: favorites, isLoading: favoritesLoading } = useSavedCards(userId);
  const { data: archived, isLoading: archivedLoading } = useArchivedCards(userId);

  const totalTopics = tree?.reduce((sum, d) => sum + d.children.length, 0) ?? 0;
  const totalCards = tree?.reduce((sum, d) => sum + d.totalCards, 0) ?? 0;

  const favoritedIds = useMemo(
    () => new Set((favorites ?? []).map((c) => c.id)),
    [favorites],
  );

  const filteredFavorites = useMemo(() => {
    if (!favorites) return [];
    if (!favoritesQuery.trim()) return favorites;
    const q = favoritesQuery.trim().toLowerCase();
    return favorites.filter(
      (card) => card.title.toLowerCase().includes(q) || card.content.toLowerCase().includes(q),
    );
  }, [favorites, favoritesQuery]);

  const filteredArchived = useMemo(() => {
    if (!archived) return [];
    if (!archivedQuery.trim()) return archived;
    const q = archivedQuery.trim().toLowerCase();
    return archived.filter(
      (card) => card.title.toLowerCase().includes(q) || card.content.toLowerCase().includes(q),
    );
  }, [archived, archivedQuery]);

  const cardWidth = Dimensions.get('window').width - 64;

  let subtitle = '';
  if (tab === 'tree') {
    subtitle = t('library.treeSubtitle', {
      topics: totalTopics,
      areas: tree?.length ?? 0,
      cards: totalCards,
    });
  } else if (tab === 'favorites') {
    subtitle = t('library.favoritesSubtitle', { n: favorites?.length ?? 0 });
  } else {
    subtitle = t('library.archivedSubtitle', { n: archived?.length ?? 0 });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.brandBar}>
        <Logo size={20} />
      </View>

      <View style={styles.header}>
        <Text style={[styles.heading, { color: c.text }]}>{t('library.heading')}</Text>
        <Text style={[styles.subtitle, { color: c.icon }]}>{subtitle}</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label={t('library.tab.tree')} active={tab === 'tree'} onPress={() => setTab('tree')} c={c} />
        <TabButton
          label={t('library.tab.favorites')}
          active={tab === 'favorites'}
          onPress={() => setTab('favorites')}
          c={c}
        />
        <TabButton
          label={t('library.tab.archived')}
          active={tab === 'archived'}
          onPress={() => setTab('archived')}
          c={c}
        />
      </View>

      {tab === 'tree' ? (
        treeLoading ? (
          <Text style={[styles.empty, { color: c.icon }]}>{t('common.loading')}</Text>
        ) : (tree ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: c.icon }]}>{t('library.emptyTree')}</Text>
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
      ) : tab === 'favorites' ? (
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.search, { color: c.text, borderColor: c.icon + '55', backgroundColor: c.tint + '08' }]}
            placeholder={t('library.searchFavorites')}
            placeholderTextColor={c.icon}
            value={favoritesQuery}
            onChangeText={setFavoritesQuery}
          />
          {favoritesLoading ? (
            <Text style={[styles.empty, { color: c.icon }]}>{t('common.loading')}</Text>
          ) : filteredFavorites.length === 0 ? (
            <Text style={[styles.empty, { color: c.icon }]}>
              {favorites?.length === 0 ? t('library.emptyFavorites') : t('library.noMatches')}
            </Text>
          ) : (
            <FlatList
              data={filteredFavorites}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <CardRow card={item} c={c} scheme={scheme} onPress={() => setDetailCard(item)} />
              )}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.search, { color: c.text, borderColor: c.icon + '55', backgroundColor: c.tint + '08' }]}
            placeholder={t('library.searchArchived')}
            placeholderTextColor={c.icon}
            value={archivedQuery}
            onChangeText={setArchivedQuery}
          />
          {archivedLoading ? (
            <Text style={[styles.empty, { color: c.icon }]}>{t('common.loading')}</Text>
          ) : filteredArchived.length === 0 ? (
            <Text style={[styles.empty, { color: c.icon }]}>
              {archived?.length === 0 ? t('library.emptyArchived') : t('library.noMatches')}
            </Text>
          ) : (
            <FlatList
              data={filteredArchived}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <CardRow card={item} c={c} scheme={scheme} onPress={() => setDetailCard(item)} />
              )}
            />
          )}
        </View>
      )}

      <TopicCardsSheet topic={activeTopic} onClose={() => setActiveTopic(null)} userId={userId} />
      <CardDetailModal
        card={detailCard}
        favorited={detailCard ? favoritedIds.has(detailCard.id) : false}
        visible={!!detailCard}
        onClose={() => setDetailCard(null)}
      />
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

function CardRow({
  card,
  c,
  scheme,
  onPress,
}: {
  card: Card;
  c: { text: string; icon: string; tint: string; background: string };
  scheme: 'light' | 'dark';
  onPress: () => void;
}) {
  const { t } = useI18n();
  const accent = TYPE_COLOR[card.card_type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: c.icon + '22',
          backgroundColor: pressed
            ? (scheme === 'dark' ? '#1f2122' : '#f7f8fa')
            : c.background,
        },
      ]}>
      <View style={[styles.accentStripe, { backgroundColor: accent }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <View style={[styles.typeDot, { backgroundColor: accent }]} />
          <Text style={[styles.rowType, { color: accent }]}>{t(TYPE_KEY[card.card_type])}</Text>
          <Text style={[styles.rowMeta, { color: c.icon }]}>
            · {card.estimated_minutes} min
          </Text>
        </View>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={[styles.rowDate, { color: c.icon }]}>
          {new Date(card.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.rowChevron, { color: c.icon }]}>›</Text>
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
  const { t } = useI18n();
  const { data: cards, isLoading } = useTopicCards(userId, topic?.id ?? null);

  return (
    <Modal visible={!!topic} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: c.background }]}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{topic?.name ?? ''}</Text>
            <Text style={[styles.modalSubtitle, { color: c.icon }]}>
              {t('library.cardsOnTopic', { n: cards?.length ?? 0 })}
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: c.icon }]}>
            <Text style={{ color: c.text }}>{t('library.close')}</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <Text style={[styles.empty, { color: c.icon }]}>{t('common.loading')}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {(cards ?? []).map((card) => (
              <View key={card.id} style={[styles.row, { borderColor: c.icon + '33' }]}>
                <View style={[styles.accentStripe, { backgroundColor: TYPE_COLOR[card.card_type] }]} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowType, { color: TYPE_COLOR[card.card_type] }]}>
                    {t(TYPE_KEY[card.card_type])}
                  </Text>
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
  heading: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2 },
  search: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  empty: { textAlign: 'center', marginTop: 60, paddingHorizontal: 32, fontSize: 15, lineHeight: 22 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentStripe: { width: 4 },
  rowContent: { flex: 1, padding: 14, gap: 4 },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  rowType: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  rowTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  rowDate: { fontSize: 11 },
  rowMeta: { fontSize: 11 },
  rowChevron: { fontSize: 24, alignSelf: 'center', paddingRight: 14, paddingLeft: 4 },
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
