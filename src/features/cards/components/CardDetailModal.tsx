import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/src/lib/i18n';

import type { Card } from '../types';
import { useCardAction, useRemoveCardAction } from '../useCardAction';
import { CardContent } from './CardContent';

const FAVORITE_COLOR = '#FFB400';

export function CardDetailModal({
  card,
  favorited,
  visible,
  onClose,
}: {
  card: Card | null;
  favorited?: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { t } = useI18n();
  const action = useCardAction();
  const removeAction = useRemoveCardAction();

  const toggleFavorite = () => {
    if (!card) return;
    const fn = favorited ? removeAction : action;
    fn.mutate({ cardId: card.id, action: 'saved' });
  };

  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: c.icon }]}>
            <Text style={{ color: c.text }}>{t('library.close')}</Text>
          </Pressable>
          <Pressable
            onPress={toggleFavorite}
            style={[
              styles.favBtn,
              {
                borderColor: FAVORITE_COLOR,
                backgroundColor: favorited ? FAVORITE_COLOR : 'transparent',
              },
            ]}>
            <Text style={{ color: favorited ? '#fff' : FAVORITE_COLOR, fontWeight: '600' }}>
              {favorited ? t('card.favorited') : t('card.favorite')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <CardContent card={card} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  favBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
});
