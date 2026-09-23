import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../categories';
import { formatMoney } from '../lib/money';
import { useTheme } from '../theme';
import type { Transaction } from '../types';

interface Props {
  tx: Transaction;
  currency: string;
  onPress: () => void;
}

export function TransactionRow({ tx, currency, onPress }: Props) {
  const t = useTheme();
  const cat = getCategory(tx.categoryId);
  const isIncome = tx.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: t.card, opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${cat.label} ${formatMoney(tx.amount, currency)}`}
    >
      <View style={[styles.icon, { backgroundColor: cat.color + '22' }]}>
        <MaterialCommunityIcons name={cat.icon} size={22} color={cat.color} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
          {cat.label}
          {tx.source === 'auto' ? '  ⚡' : ''}
        </Text>
        {tx.note ? (
          <Text style={[styles.note, { color: t.muted }]} numberOfLines={1}>
            {tx.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: isIncome ? t.income : t.expense }]}>
        {isIncome ? '+' : '−'}
        {formatMoney(tx.amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 13, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
