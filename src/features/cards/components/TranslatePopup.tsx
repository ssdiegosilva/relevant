import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/src/lib/i18n';

import { useTranslateText } from '../useTranslateText';

export function TranslatePopup({
  word,
  visible,
  onClose,
}: {
  word: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { t, lang } = useI18n();
  const translate = useTranslateText();
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !word) return;
    setTranslation(null);
    setError(null);
    translate
      .mutateAsync({ text: word, targetLang: lang })
      .then((res) => setTranslation(res.translation))
      .catch((e: any) => setError(e?.message ?? 'failed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, word, lang]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: c.background, borderColor: c.icon + '33' }]}>
          <Text style={[styles.original, { color: c.icon }]}>{word ?? ''}</Text>
          <View style={styles.body}>
            {translate.isPending && !translation && !error ? (
              <ActivityIndicator color={c.tint} />
            ) : error ? (
              <Text style={[styles.error, { color: c.icon }]}>{t('translate.error')}</Text>
            ) : (
              <Text style={[styles.translation, { color: c.text }]}>{translation ?? ''}</Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: c.tint }]}>
            <Text style={styles.closeText}>{t('common.done')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    minWidth: 240,
    maxWidth: 340,
    alignItems: 'center',
  },
  original: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  body: { minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  translation: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  error: { fontSize: 14 },
  closeBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  closeText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
