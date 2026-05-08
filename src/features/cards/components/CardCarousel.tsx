import { useRef, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { CardItem } from './CardItem';
import type { Card } from '../types';

const { width } = Dimensions.get('window');

export function CardCarousel({
  cards,
  onStudied,
  onSave,
  onSkip,
  studiedIds,
  savedIds,
  skippedIds,
}: {
  cards: Card[];
  onStudied: (card: Card) => void;
  onSave: (card: Card) => void;
  onSkip: (card: Card) => void;
  studiedIds: Set<string>;
  savedIds: Set<string>;
  skippedIds: Set<string>;
}) {
  const listRef = useRef<FlatList<Card>>(null);
  const [_, setIndex] = useState(0);

  return (
    <FlatList
      ref={listRef}
      data={cards}
      keyExtractor={(c) => c.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        setIndex(i);
      }}
      renderItem={({ item, index }) => (
        <View style={[styles.page, { width }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <CardItem
              card={item}
              index={index}
              total={cards.length}
              studied={studiedIds.has(item.id)}
              saved={savedIds.has(item.id)}
              skipped={skippedIds.has(item.id)}
              onStudied={() => onStudied(item)}
              onSave={() => onSave(item)}
              onSkip={() => onSkip(item)}
            />
          </ScrollView>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
});
