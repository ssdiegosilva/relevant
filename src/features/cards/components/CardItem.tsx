import Markdown from 'react-native-markdown-display';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/src/lib/i18n';
import type { StringKey } from '@/src/lib/strings';

import type { Card, CardType } from '../types';

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

const ACTION_COLOR = '#3478F6';
const FAVORITE_COLOR = '#FFB400';

export type CardActionTriggers = {
  onFavorite: () => void;
  onNext: () => void;
  onFinish: () => void;
};

export function CardItem({
  card,
  index,
  total,
  isLast,
  favorited,
  finishing,
  onFavorite,
  onNext,
  onFinish,
}: {
  card: Card;
  index: number;
  total: number;
  isLast: boolean;
  favorited?: boolean;
  finishing?: boolean;
} & CardActionTriggers) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const accent = TYPE_COLOR[card.card_type];
  const { t } = useI18n();

  return (
    <View style={[styles.card, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: accent + '22' }]}>
          <Text style={{ color: accent, fontWeight: '600', fontSize: 12 }}>
            {t(TYPE_KEY[card.card_type])}
          </Text>
        </View>
        <Text style={[styles.progress, { color: c.icon }]}>
          {t('card.progress', { i: index + 1, total, min: card.estimated_minutes })}
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
          label={favorited ? t('card.favorited') : t('card.favorite')}
          color={FAVORITE_COLOR}
          outlined
          filled={favorited}
          onPress={onFavorite}
        />
        {isLast ? (
          <ActionButton
            label={finishing ? '…' : t('card.finish')}
            color={ACTION_COLOR}
            filled
            disabled={finishing}
            onPress={onFinish}
          />
        ) : (
          <ActionButton
            label={t('card.next')}
            color={ACTION_COLOR}
            filled
            onPress={onNext}
          />
        )}
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
