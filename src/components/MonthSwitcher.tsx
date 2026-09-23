import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMonthLabel } from '../lib/money';
import { shiftMonth, type MonthKey } from '../lib/stats';
import { useTheme } from '../theme';

export function MonthSwitcher({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(shiftMonth(month, -1))} hitSlop={12} accessibilityLabel="Previous month">
        <MaterialCommunityIcons name="chevron-left" size={28} color={t.text} />
      </Pressable>
      <Text style={[styles.label, { color: t.text }]}>{formatMonthLabel(month)}</Text>
      <Pressable onPress={() => onChange(shiftMonth(month, 1))} hitSlop={12} accessibilityLabel="Next month">
        <MaterialCommunityIcons name="chevron-right" size={28} color={t.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontSize: 17, fontWeight: '600', textTransform: 'capitalize' },
});
