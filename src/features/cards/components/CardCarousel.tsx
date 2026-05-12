import { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';

import { CardItem } from './CardItem';
import type { Card } from '../types';

const { width } = Dimensions.get('window');

export function CardCarousel({
  cards,
  onFavorite,
  onFinish,
  favoritedIds,
  finishing,
}: {
  cards: Card[];
  onFavorite: (card: Card) => void;
  onFinish: () => void;
  favoritedIds: Set<string>;
  finishing: boolean;
}) {
  const listRef = useRef<FlatList<Card>>(null);
  const [_, setIndex] = useState(0);

  const handleNext = (index: number) => {
    if (index < cards.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

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
          <CardItem
            card={item}
            index={index}
            total={cards.length}
            isLast={index === cards.length - 1}
            favorited={favoritedIds.has(item.id)}
            finishing={finishing}
            onFavorite={() => onFavorite(item)}
            onNext={() => handleNext(index)}
            onFinish={onFinish}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
});
