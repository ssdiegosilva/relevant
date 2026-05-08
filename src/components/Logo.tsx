import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function LogoMark({ size = 28, color }: { size?: number; color?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const tint = color ?? Colors[scheme].tint;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Line x1="8" y1="11" x2="24" y2="11" stroke={tint} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="8" y1="11" x2="16" y2="23" stroke={tint} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="24" y1="11" x2="16" y2="23" stroke={tint} strokeWidth="1.6" strokeLinecap="round" />
      <Circle cx="8" cy="11" r="3" fill={tint} />
      <Circle cx="24" cy="11" r="3" fill={tint} />
      <Circle cx="16" cy="23" r="4.5" fill={tint} />
    </Svg>
  );
}

export function Logo({
  size = 28,
  variant = 'inline',
  color,
}: {
  size?: number;
  variant?: 'inline' | 'stacked';
  color?: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const textColor = color ?? c.text;
  const fontSize = size * 0.95;

  if (variant === 'stacked') {
    return (
      <View style={styles.stacked}>
        <LogoMark size={size * 1.6} color={color} />
        <Text style={[styles.text, { color: textColor, fontSize, letterSpacing: -0.5 }]}>relevant</Text>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <LogoMark size={size} color={color} />
      <Text style={[styles.text, { color: textColor, fontSize, letterSpacing: -0.5 }]}>relevant</Text>
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerTopRow}>
        <Logo size={20} />
      </View>
      <Text style={[styles.headerTitle, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.headerSubtitle, { color: c.icon }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stacked: { alignItems: 'center', gap: 12 },
  text: { fontWeight: '800' },
  headerWrap: { paddingHorizontal: 24, paddingTop: 8, gap: 8 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '800' },
  headerSubtitle: { fontSize: 14 },
});
