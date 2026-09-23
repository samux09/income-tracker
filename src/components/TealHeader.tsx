import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { chevronLeft, headerBg, headerCircles } from '../assets/figma';
import { font } from '../theme';

/** Curved teal background with decorative rings, drawn behind the top of a screen. */
export function TealBackground() {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.bg}>
      <SvgXml xml={headerBg} width={width} height={287} />
      <SvgXml xml={headerCircles} width={267} height={219} style={styles.circles} />
    </View>
  );
}

interface BarProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Centered white title with optional back chevron, placed over <TealBackground />. */
export function TealTitleBar({ title, onBack, right }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { marginTop: insets.top + 37 }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <SvgXml xml={chevronLeft} width={28} height={28} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 287, pointerEvents: 'none' },
  circles: { position: 'absolute', left: -55, top: -22 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, height: 28 },
  side: { width: 40 },
  title: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontFamily: font.semibold, fontSize: 18 },
});
