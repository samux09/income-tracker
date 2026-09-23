import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { getCategory } from '../categories';
import { brand, font, useTheme } from '../theme';
import type { TransactionType } from '../types';

interface TileProps {
  categoryId: string;
  size?: number;
  iconSize?: number;
  radius?: number;
  /** Tile background; defaults to the light teal tile. */
  background?: string;
  /** Icon color; defaults to the category color. */
  color?: string;
}

/** Category icon on a rounded tile (8px radius) or circle (radius = size / 2). */
export function CategoryTile({ categoryId, size = 50, iconSize = 28, radius = 8, background, color }: TileProps) {
  const t = useTheme();
  const cat = getCategory(categoryId);
  return (
    <View
      style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor: background ?? t.tile }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons name={cat.icon} size={iconSize} color={color ?? cat.color} />
    </View>
  );
}

/** Gradient pill button from the onboarding "Get Started" design. */
export function PrimaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.88 : 1 }, style]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

/** Outlined pill button ("Download Receipt" in the design). */
export function OutlineButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.outline, { borderColor: t.primary, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <Text style={[styles.outlineText, { color: t.primary }]}>{label}</Text>
    </Pressable>
  );
}

/** Two-option pill switch used for Expense / Income. */
export function TypeSwitch({ value, onChange, compact }: { value: TransactionType; onChange: (v: TransactionType) => void; compact?: boolean }) {
  const t = useTheme();
  const options: [TransactionType, string][] = [
    ['expense', compact ? 'Expense' : 'Expenses'],
    ['income', 'Income'],
  ];
  return (
    <View style={[compact ? styles.switchCompact : styles.switch, { backgroundColor: t.track }]} accessibilityRole="tablist">
      {options.map(([key, label]) => {
        const active = key === value;
        const activeStyle = compact ? { backgroundColor: t.primary } : { backgroundColor: t.card, boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)' };
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[compact ? styles.switchBtnCompact : styles.switchBtn, active && activeStyle]}
          >
            <Text style={[styles.switchText, compact && { fontSize: 13 }, { color: active ? (compact ? '#FFFFFF' : t.text) : t.muted }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.sectionAction, { color: t.muted }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  primary: {
    height: 64,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.primary,
    experimental_backgroundImage: `linear-gradient(180deg, ${brand.buttonTop} 0%, ${brand.buttonBottom} 100%)`,
    boxShadow: '0px 22px 34px -10px rgba(63, 135, 130, 0.6)',
  },
  primaryText: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 18 },
  outline: { height: 60, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontFamily: font.semibold, fontSize: 18 },
  switch: { flexDirection: 'row', height: 48, padding: 4, borderRadius: 40 },
  switchBtn: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  switchCompact: { flexDirection: 'row', padding: 3, gap: 4, borderRadius: 20 },
  switchBtnCompact: { height: 30, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontFamily: font.medium, fontSize: 14 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  sectionTitle: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.36 },
  sectionAction: { fontFamily: font.regular, fontSize: 14, letterSpacing: -0.28, paddingVertical: 12 },
});
