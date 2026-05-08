import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import type { Domain, StudiedTopic } from '../useKnowledgeTree';

const TREE_HEIGHT = 130;
const MAX_VISIBLE = 6;

export function DomainTreeCard({
  domain,
  width,
  onPressTopic,
}: {
  domain: Domain;
  width: number;
  onPressTopic: (topic: StudiedTopic) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const visible = domain.children.slice(0, MAX_VISIBLE);
  const remaining = domain.children.length - visible.length;
  const rootX = width / 2;
  const rootY = 30;
  const childrenY = 100;
  const spacing = visible.length > 0 ? width / (visible.length + 1) : 0;

  return (
    <View style={[styles.card, { borderColor: c.icon + '33', backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.domainName, { color: c.text }]}>{domain.root.name}</Text>
        <Text style={[styles.stats, { color: c.icon }]}>
          {domain.children.length} {domain.children.length === 1 ? 'topic' : 'topics'} · {domain.totalCards}{' '}
          {domain.totalCards === 1 ? 'card' : 'cards'}
        </Text>
      </View>

      {visible.length > 0 ? (
        <Svg width={width} height={TREE_HEIGHT}>
          {visible.map((child, i) => {
            const childX = spacing * (i + 1);
            const d = `M ${rootX} ${rootY} C ${rootX} ${rootY + 28}, ${childX} ${childrenY - 28}, ${childX} ${childrenY}`;
            return (
              <Path
                key={child.id}
                d={d}
                stroke={c.tint}
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
                opacity={0.7}
              />
            );
          })}
          <Circle cx={rootX} cy={rootY} r={9} fill={c.tint} />
          <Circle cx={rootX} cy={rootY} r={4} fill={c.background} />
          {visible.map((child, i) => {
            const childX = spacing * (i + 1);
            const r = Math.min(9, 4 + Math.sqrt(child.cardCount) * 1.5);
            return <Circle key={child.id} cx={childX} cy={childrenY} r={r} fill={c.tint} />;
          })}
        </Svg>
      ) : (
        <View style={[styles.emptyTree, { width, height: TREE_HEIGHT }]}>
          <Svg width={40} height={40}>
            <Circle cx={20} cy={20} r={9} fill={c.tint} />
            <Circle cx={20} cy={20} r={4} fill={c.background} />
          </Svg>
          <Text style={[styles.emptyHint, { color: c.icon }]}>Just the root for now</Text>
        </View>
      )}

      <View style={styles.chips}>
        {visible.map((child) => (
          <Pressable
            key={child.id}
            onPress={() => onPressTopic(child)}
            style={[styles.chip, { borderColor: c.tint + '55' }]}>
            <Text style={[styles.chipName, { color: c.text }]}>{child.name}</Text>
            <Text style={[styles.chipCount, { color: c.tint }]}>{child.cardCount}</Text>
          </Pressable>
        ))}
        {remaining > 0 ? (
          <View style={[styles.chip, { borderColor: c.icon + '33', borderStyle: 'dashed' }]}>
            <Text style={[styles.chipName, { color: c.icon }]}>+{remaining} more</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  header: { gap: 4 },
  domainName: { fontSize: 18, fontWeight: '700' },
  stats: { fontSize: 12 },
  emptyTree: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyHint: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipName: { fontSize: 13, fontWeight: '500' },
  chipCount: { fontSize: 12, fontWeight: '700' },
});
