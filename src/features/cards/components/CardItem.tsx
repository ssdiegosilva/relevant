import Markdown from 'react-native-markdown-display';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import type { Card, CardType } from '../types';

const TYPE_LABEL: Record<CardType, string> = {
  concept: 'Concept',
  example: 'Example',
  best_practice: 'Best practice',
  pitfall: 'Pitfall',
  news: 'News',
};

const TYPE_COLOR: Record<CardType, string> = {
  concept: '#3478F6',
  example: '#34C759',
  best_practice: '#5856D6',
  pitfall: '#FF9500',
  news: '#FF3B30',
};

export type CardActionTriggers = {
  onStudied: () => void;
  onSave: () => void;
  onSkip: () => void;
};

export function CardItem({
  card,
  index,
  total,
  studied,
  saved,
  skipped,
  onStudied,
  onSave,
  onSkip,
}: {
  card: Card;
  index: number;
  total: number;
  studied?: boolean;
  saved?: boolean;
  skipped?: boolean;
} & CardActionTriggers) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const accent = TYPE_COLOR[card.card_type];

  return (
    <View style={[styles.card, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: accent + '22' }]}>
          <Text style={{ color: accent, fontWeight: '600', fontSize: 12 }}>
            {TYPE_LABEL[card.card_type]}
          </Text>
        </View>
        <Text style={[styles.progress, { color: c.icon }]}>
          {index + 1} of {total} · {card.estimated_minutes} min
        </Text>
      </View>

      <Text style={[styles.title, { color: c.text }]}>{card.title}</Text>

      <View style={styles.markdownContainer}>
        <Markdown
          style={{
            body: { color: c.text, fontSize: 15, lineHeight: 22 },
            heading1: { color: c.text, fontSize: 20, fontWeight: '700' },
            heading2: { color: c.text, fontSize: 17, fontWeight: '700' },
            heading3: { color: c.text, fontSize: 15, fontWeight: '700' },
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
          }}>
          {card.content}
        </Markdown>
      </View>

      <View style={styles.actions}>
        <ActionButton
          label={studied ? '✓ Studied' : 'Studied'}
          color={c.tint}
          filled={studied}
          disabled={studied}
          onPress={onStudied}
        />
        <ActionButton
          label={saved ? '✓ Saved' : 'Save'}
          color={c.tint}
          outlined
          filled={saved}
          disabled={saved}
          onPress={onSave}
        />
        <ActionButton
          label={skipped ? '✓ Skipped' : 'Skip'}
          color={c.icon}
          outlined
          filled={skipped}
          disabled={skipped}
          onPress={onSkip}
        />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  color,
  outlined,
  filled,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  outlined?: boolean;
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const bg = filled ? color : outlined ? 'transparent' : color;
  const fg = outlined && !filled ? color : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        {
          backgroundColor: bg,
          borderColor: color,
          opacity: disabled ? 0.6 : 1,
        },
      ]}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, paddingHorizontal: 4, paddingVertical: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progress: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  markdownContainer: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
});
