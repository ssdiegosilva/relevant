import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/src/lib/i18n';
import type { StringKey } from '@/src/lib/strings';

import type { Card, CardType } from '../types';
import { useCardDeepenings, useDeepenCard } from '../useDeepenCard';
import { TranslatePopup } from './TranslatePopup';

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

function cleanWord(s: string) {
  return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
}

export function CardContent({
  card,
  progressText,
}: {
  card: Card;
  progressText?: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const accent = TYPE_COLOR[card.card_type];
  const { t } = useI18n();

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const deepen = useDeepenCard(card.id);
  const { data: deepenings } = useCardDeepenings(card.id);

  const onLongPressWord = (raw: string) => {
    const w = cleanWord(raw);
    if (w.length >= 2 && w.length <= 80) setSelectedWord(w);
  };

  const markdownStyle = useMemo(
    () => ({
      body: { color: c.text, fontSize: 15, lineHeight: 22 },
      heading1: { color: c.text, fontSize: 20, fontWeight: '700' as const },
      heading2: { color: c.text, fontSize: 17, fontWeight: '700' as const },
      heading3: { color: c.text, fontSize: 15, fontWeight: '700' as const },
      code_inline: {
        backgroundColor: scheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
        color: scheme === 'dark' ? '#e0e0e0' : '#1a1a1a',
        fontFamily: 'Menlo',
        fontSize: 13,
        paddingHorizontal: 4,
        borderRadius: 3,
      },
      code_block: {
        backgroundColor: scheme === 'dark' ? '#1a1a1a' : '#f6f6f6',
        color: scheme === 'dark' ? '#e0e0e0' : '#1a1a1a',
        fontFamily: 'Menlo',
        fontSize: 13,
        padding: 10,
        borderRadius: 6,
      },
      fence: {
        backgroundColor: scheme === 'dark' ? '#1a1a1a' : '#f6f6f6',
        color: scheme === 'dark' ? '#e0e0e0' : '#1a1a1a',
        fontFamily: 'Menlo',
        fontSize: 13,
        padding: 10,
        borderRadius: 6,
      },
      link: { color: c.tint },
    }),
    [c, scheme],
  );

  const selectedCleanLower = selectedWord?.toLowerCase() ?? null;
  const highlightBg = c.tint + '44';

  const markdownRules = useMemo(
    () => ({
      text: (node: any, _children: any, _parent: any, styles: any) => {
        const text: string = node.content ?? '';
        const parts = text.split(/(\s+)/);
        return (
          <Text key={node.key} style={styles.text}>
            {parts.map((part, i) => {
              if (!part) return null;
              if (/^\s+$/.test(part)) return part;
              const cleaned = cleanWord(part).toLowerCase();
              const isSelected =
                !!selectedCleanLower && cleaned === selectedCleanLower;
              return (
                <PressableWord
                  key={i}
                  word={part}
                  selectedBg={isSelected ? highlightBg : undefined}
                  pressBg={highlightBg}
                  onLongPress={() => onLongPressWord(part)}
                />
              );
            })}
          </Text>
        );
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCleanLower, highlightBg],
  );

  const trail = deepenings ?? [];

  // Accumulate ALL suggestions ever shown for this card, minus the ones
  // the user has already chosen (= prompts of existing deepenings).
  const suggestions = useMemo(() => {
    const used = new Set(trail.map((d) => d.prompt.toLowerCase()));
    const all: string[] = [
      ...(card.suggestions ?? []),
      ...trail.flatMap((d) => d.suggestions ?? []),
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of all) {
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      if (used.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }, [card.suggestions, trail]);

  const onSuggestionTap = (direction: string) => {
    if (deepen.isPending) return;
    deepen.mutateAsync(direction).catch((e: any) => {
      Alert.alert(t('card.deepenError'), e?.message ?? '');
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: accent + '22' }]}>
          <Text style={{ color: accent, fontWeight: '600', fontSize: 12 }}>
            {t(TYPE_KEY[card.card_type])}
          </Text>
        </View>
        {progressText ? (
          <Text style={[styles.progress, { color: c.icon }]}>{progressText}</Text>
        ) : null}
      </View>

      <Text style={[styles.title, { color: c.text }]}>{card.title}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Markdown style={markdownStyle} rules={markdownRules}>
          {card.content}
        </Markdown>

        {trail.map((d) => (
          <View key={d.id} style={[styles.deepening, { borderColor: c.tint + '33' }]}>
            <Text style={[styles.deepeningPrompt, { color: c.tint }]}>↳ {d.prompt}</Text>
            <Markdown style={markdownStyle} rules={markdownRules}>
              {d.content}
            </Markdown>
          </View>
        ))}

        {deepen.isPending ? (
          <View style={styles.deepenLoading}>
            <ActivityIndicator color={c.tint} />
            <Text style={[styles.deepenLoadingText, { color: c.icon }]}>{t('card.deepening')}</Text>
          </View>
        ) : suggestions.length > 0 ? (
          <View style={styles.suggestionsBlock}>
            <Text style={[styles.suggestionsLabel, { color: c.icon }]}>{t('card.goDeeper')}</Text>
            <View style={styles.suggestionsRow}>
              {suggestions.map((s, i) => (
                <Pressable
                  key={`${i}-${s}`}
                  onPress={() => onSuggestionTap(s)}
                  style={[styles.suggestionChip, { borderColor: c.tint + '66', backgroundColor: c.tint + '0D' }]}>
                  <Text style={[styles.suggestionText, { color: c.tint }]} numberOfLines={2}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[styles.hint, { color: c.icon }]}>{t('card.tapHoldHint')}</Text>
      </ScrollView>

      <TranslatePopup
        word={selectedWord}
        visible={!!selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </View>
  );
}

function PressableWord({
  word,
  selectedBg,
  pressBg,
  onLongPress,
}: {
  word: string;
  selectedBg?: string;
  pressBg: string;
  onLongPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const bg = pressed ? pressBg : selectedBg;
  return (
    <Text
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onLongPress={onLongPress}
      suppressHighlighting
      style={bg ? { backgroundColor: bg, borderRadius: 3 } : undefined}>
      {word}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progress: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginTop: 10, marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  deepening: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, gap: 6 },
  deepeningPrompt: { fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  deepenLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  deepenLoadingText: { fontSize: 14 },
  suggestionsBlock: { marginTop: 18, gap: 8 },
  suggestionsLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: '100%',
  },
  suggestionText: { fontSize: 13, fontWeight: '500' },
  hint: { fontSize: 11, fontStyle: 'italic', marginTop: 18, textAlign: 'center' },
});
