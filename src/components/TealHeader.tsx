import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  /** Makes the title a button with a chevron (e.g. to switch Expense / Income). */
  onTitlePress?: () => void;
  right?: ReactNode;
  /** Title and chevron color; white over the teal header. */
  color?: string;
}

/** Centered title with optional back chevron, 68px below the safe area like the design. */
export function TitleBar({ title, onBack, onTitlePress, right, color = '#FFFFFF' }: BarProps) {
  const insets = useSafeAreaInsets();
  const titleText = <Text style={[styles.title, { color }]}>{title}</Text>;
  return (
    <View style={[styles.bar, { marginTop: insets.top + 24 }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.button} accessibilityRole="button" accessibilityLabel="Back">
            {color === '#FFFFFF' ? (
              <SvgXml xml={chevronLeft} width={28} height={28} />
            ) : (
              <MaterialCommunityIcons name="chevron-left" size={30} color={color} />
            )}
          </Pressable>
        ) : null}
      </View>
      {onTitlePress ? (
        <Pressable onPress={onTitlePress} style={styles.titleButton} accessibilityRole="button">
          {titleText}
          <MaterialCommunityIcons name="chevron-down" size={22} color={color} />
        </Pressable>
      ) : (
        titleText
      )}
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

/** Square 44px icon button for the right side of a title bar. */
export function BarButton({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.button} accessibilityRole="button" accessibilityLabel={label}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 287, pointerEvents: 'none' },
  circles: { position: 'absolute', left: -55, top: -22 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  side: { width: 44 },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleButton: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44 },
  title: { textAlign: 'center', fontFamily: font.semibold, fontSize: 18 },
});
