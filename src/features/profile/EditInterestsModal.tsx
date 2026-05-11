import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useI18n } from '@/src/lib/i18n';

import {
  INTERESTS_OPTIONS,
  INTEREST_LOOKUP,
  MACRO_CATEGORIES,
  MAX_INTERESTS,
  macroAllInterests,
  type MacroCategory,
} from './constants';
import { useUpdateProfile } from './useUpdateProfile';

export function EditInterestsModal({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial: string[];
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const update = useUpdateProfile();
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>(initial);
  const [customInput, setCustomInput] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      setSelected(initial);
      setCustomInput('');
      const next: Record<string, boolean> = {};
      for (const cat of MACRO_CATEGORIES) {
        next[cat.id] = macroAllInterests(cat).some((i) =>
          initial.some((s) => s.toLowerCase() === i.toLowerCase()),
        );
      }
      setExpanded(next);
    }
  }, [visible, initial]);

  const customSelected = useMemo(
    () => selected.filter((s) => !INTEREST_LOOKUP.has(s.toLowerCase())),
    [selected],
  );

  const isSelected = (option: string) =>
    selected.some((s) => s.toLowerCase() === option.toLowerCase());

  const togglePredefined = (option: string) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === option.toLowerCase());
      if (exists) return prev.filter((s) => s.toLowerCase() !== option.toLowerCase());
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, option];
    });
  };

  const removeCustom = (value: string) => {
    setSelected((prev) => prev.filter((s) => s !== value));
  };

  const addCustom = () => {
    const raw = customInput.trim();
    if (!raw) return;
    if (raw.length > 40) {
      Alert.alert(t('interests.tooLong.title'), t('interests.tooLong.body'));
      return;
    }
    if (selected.some((s) => s.toLowerCase() === raw.toLowerCase())) {
      setCustomInput('');
      return;
    }
    if (selected.length >= MAX_INTERESTS) {
      Alert.alert(t('interests.limitReached.title'), t('interests.limitReached.body', { max: MAX_INTERESTS }));
      return;
    }
    const matchPredefined = INTERESTS_OPTIONS.find(
      (o) => o.toLowerCase() === raw.toLowerCase(),
    );
    setSelected((prev) => [...prev, matchPredefined ?? raw]);
    setCustomInput('');
  };

  const save = () => {
    if (selected.length < 1) {
      Alert.alert(t('interests.pickAtLeastOne.title'), t('interests.pickAtLeastOne.body'));
      return;
    }
    update.mutate(
      { interests: selected },
      {
        onSuccess: onClose,
        onError: (e: any) => Alert.alert(t('interests.couldNotSave'), e?.message ?? t('common.tryAgain')),
      },
    );
  };

  const dirty =
    selected.length !== initial.length ||
    selected.some((s) => !initial.includes(s)) ||
    initial.some((s) => !selected.includes(s));

  const atLimit = selected.length >= MAX_INTERESTS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={[styles.headerButton, { borderColor: c.icon }]}>
            <Text style={{ color: c.text }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text style={[styles.title, { color: c.text }]}>{t('interests.title')}</Text>
          <Pressable
            onPress={save}
            disabled={!dirty || update.isPending}
            style={[
              styles.headerButton,
              {
                backgroundColor: c.tint,
                borderColor: c.tint,
                opacity: !dirty || update.isPending ? 0.5 : 1,
              },
            ]}>
            {update.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: c.icon }]}>{t('interests.subtitle')}</Text>

          <View style={styles.customSection}>
            <Text style={[styles.sectionLabel, { color: c.icon }]}>{t('interests.addYourOwn')}</Text>
            <View style={styles.customRow}>
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                onSubmitEditing={addCustom}
                placeholder={t('interests.placeholder')}
                placeholderTextColor={c.icon}
                style={[styles.customInput, { color: c.text, borderColor: c.icon + '66' }]}
                returnKeyType="done"
                autoCapitalize="words"
              />
              <Pressable
                onPress={addCustom}
                disabled={!customInput.trim() || atLimit}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: c.tint,
                    opacity: !customInput.trim() || atLimit ? 0.4 : 1,
                  },
                ]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('interests.add')}</Text>
              </Pressable>
            </View>
            {customSelected.length > 0 ? (
              <View style={styles.chipRow}>
                {customSelected.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => removeCustom(s)}
                    style={[
                      styles.chip,
                      { borderColor: c.tint, backgroundColor: c.tint + '22' },
                    ]}>
                    <Text style={{ color: c.tint, fontWeight: '600' }}>{s}  ✕</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {MACRO_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              expanded={!!expanded[cat.id]}
              onToggle={() => setExpanded((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
              selectedCount={macroAllInterests(cat).filter((i) => isSelected(i)).length}
              isSelected={isSelected}
              onTogglePredefined={togglePredefined}
              atLimit={atLimit}
              c={c}
            />
          ))}

          <Text style={[styles.count, { color: c.icon }]}>
            {t('interests.selected', { n: selected.length, max: MAX_INTERESTS })}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CategoryCard({
  category,
  expanded,
  onToggle,
  selectedCount,
  isSelected,
  onTogglePredefined,
  atLimit,
  c,
}: {
  category: MacroCategory;
  expanded: boolean;
  onToggle: () => void;
  selectedCount: number;
  isSelected: (option: string) => boolean;
  onTogglePredefined: (option: string) => void;
  atLimit: boolean;
  c: { text: string; icon: string; tint: string };
}) {
  return (
    <View style={[styles.categoryCard, { borderColor: c.icon + '33' }]}>
      <Pressable onPress={onToggle} style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={[styles.iconBubble, { backgroundColor: c.tint + '1A' }]}>
            <MaterialCommunityIcons
              name={category.icon as any}
              size={22}
              color={c.tint}
            />
          </View>
          <Text style={[styles.categoryName, { color: c.text }]}>{category.name}</Text>
        </View>
        <View style={styles.categoryHeaderRight}>
          {selectedCount > 0 ? (
            <View style={[styles.countBadge, { backgroundColor: c.tint }]}>
              <Text style={styles.countBadgeText}>{selectedCount}</Text>
            </View>
          ) : null}
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={c.icon}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.groupsContainer}>
          {category.groups.map((group) => (
            <View key={group.name} style={styles.subGroup}>
              <Text style={[styles.subGroupLabel, { color: c.icon }]}>{group.name}</Text>
              <View style={styles.chipRow}>
                {group.interests.map((option) => {
                  const active = isSelected(option);
                  return (
                    <Pressable
                      key={option}
                      onPress={() => onTogglePredefined(option)}
                      disabled={!active && atLimit}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? c.tint : c.icon,
                          backgroundColor: active ? c.tint + '22' : 'transparent',
                          opacity: !active && atLimit ? 0.4 : 1,
                        },
                      ]}>
                      <Text style={{ color: active ? c.tint : c.text, fontWeight: active ? '600' : '400' }}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
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
  title: { fontSize: 17, fontWeight: '700' },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  body: { padding: 16, paddingBottom: 48, gap: 12 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  customSection: { gap: 4, marginBottom: 4 },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontSize: 16, fontWeight: '600' },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  groupsContainer: { marginTop: 12, gap: 14 },
  subGroup: { gap: 4 },
  subGroupLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  count: { fontSize: 13, textAlign: 'center', marginTop: 12 },
});
