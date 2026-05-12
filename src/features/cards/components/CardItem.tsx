import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/src/lib/i18n';

import type { Card } from '../types';
import { CardContent } from './CardContent';

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
  const { t } = useI18n();

  return (
    <View style={[styles.card, { backgroundColor: c.background }]}>
      <CardContent
        card={card}
        progressText={t('card.progress', { i: index + 1, total, min: card.estimated_minutes })}
      />

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
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
});
