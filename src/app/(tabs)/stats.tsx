import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../../categories';
import { MonthSwitcher } from '../../components/MonthSwitcher';
import { formatMoney } from '../../lib/money';
import { expensesByCategory, inMonth, summarize } from '../../lib/stats';
import { useMonth } from '../../store/useMonth';
import { useStore } from '../../store/StoreProvider';
import { useTheme } from '../../theme';

export default function StatsScreen() {
  const t = useTheme();
  const { transactions, settings } = useStore();
  const [month, setMonth] = useMonth();

  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const totals = useMemo(() => expensesByCategory(monthTxs), [monthTxs]);
  const { expenses } = useMemo(() => summarize(monthTxs), [monthTxs]);

  return (
    <View style={{ flex: 1 }}>
      <MonthSwitcher month={month} onChange={setMonth} />
      <Text style={[styles.total, { color: t.muted }]}>
        Total spent: <Text style={{ color: t.expense, fontWeight: '700' }}>{formatMoney(expenses, settings.currency)}</Text>
      </Text>
      <FlatList
        data={totals}
        keyExtractor={(c) => c.categoryId}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: t.muted }]}>No expenses this month.</Text>}
        renderItem={({ item }) => {
          const cat = getCategory(item.categoryId);
          return (
            <View style={[styles.card, { backgroundColor: t.card }]}>
              <View style={styles.row}>
                <MaterialCommunityIcons name={cat.icon} size={22} color={cat.color} />
                <Text style={[styles.label, { color: t.text }]}>{cat.label}</Text>
                <Text style={[styles.amount, { color: t.text }]}>{formatMoney(item.total, settings.currency)}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: t.border }]}>
                <View style={[styles.bar, { width: `${Math.max(item.share * 100, 1)}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={[styles.meta, { color: t.muted }]}>
                {(item.share * 100).toFixed(1)}% · {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  total: { paddingHorizontal: 16, fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 48 },
  card: { padding: 14, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  meta: { fontSize: 12, marginTop: 6 },
});
