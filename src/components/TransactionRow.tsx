import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../categories';
import { formatDateLabel, formatMoney } from '../lib/money';
import { toISODate } from '../lib/stats';
import { font, useTheme } from '../theme';
import type { Transaction } from '../types';

interface Props {
  tx: Transaction;
  currency: string;
  onPress: () => void;
}

export function relativeDay(iso: string): string {
  const today = new Date();
  if (iso === toISODate(today)) return 'Today';
  if (iso === toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))) return 'Yesterday';
  return formatDateLabel(iso);
}

export function TransactionRow({ tx, currency, onPress }: Props) {
  const t = useTheme();
  const cat = getCategory(tx.categoryId);
  const isIncome = tx.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${cat.label} ${formatMoney(tx.amount, currency)}`}
    >
      <View style={[styles.icon, { backgroundColor: t.tile }]}>
        <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.title }]} numberOfLines={1}>
          {tx.note || cat.label}
          {tx.source === 'auto' ? '  ⚡' : ''}
        </Text>
        <Text style={[styles.sub, { color: t.muted }]} numberOfLines={1}>
          {tx.note ? `${cat.label} · ` : ''}
          {relativeDay(tx.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? t.income : t.expense }]}>
        {isIncome ? '+ ' : '- '}
        {formatMoney(tx.amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 22, paddingVertical: 8 },
  icon: { width: 50, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontFamily: font.medium, fontSize: 16, letterSpacing: -0.32 },
  sub: { fontFamily: font.regular, fontSize: 13, letterSpacing: -0.26 },
  amount: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.72, fontVariant: ['tabular-nums'] },
});
