import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { MonthSwitcher } from '../../components/MonthSwitcher';
import { TransactionRow } from '../../components/TransactionRow';
import { formatDateLabel, formatMoney } from '../../lib/money';
import { groupByDay, inMonth, summarize } from '../../lib/stats';
import { useMonth } from '../../store/useMonth';
import { useStore } from '../../store/StoreProvider';
import { useTheme } from '../../theme';
import type { TransactionType } from '../../types';

export default function TransactionsScreen() {
  const t = useTheme();
  const { loaded, transactions, settings } = useStore();
  const [month, setMonth] = useMonth();

  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTxs), [monthTxs]);
  const sections = useMemo(() => groupByDay(monthTxs), [monthTxs]);

  const add = (type: TransactionType) => router.push({ pathname: '/transaction', params: { type } });

  if (!loaded) return <ActivityIndicator style={{ marginTop: 48 }} />;

  return (
    <View style={{ flex: 1 }}>
      <MonthSwitcher month={month} onChange={setMonth} />

      <View style={[styles.summary, { backgroundColor: t.card }]}>
        <Text style={[styles.balanceLabel, { color: t.muted }]}>Balance</Text>
        <Text style={[styles.balance, { color: summary.balance < 0 ? t.expense : t.text }]}>
          {formatMoney(summary.balance, settings.currency)}
        </Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Income" value={formatMoney(summary.income, settings.currency)} color={t.income} />
          <SummaryItem label="Expenses" value={formatMoney(summary.expenses, settings.currency)} color={t.expense} />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(tx) => tx.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.dayHeader, { color: t.muted }]}>{formatDateLabel(section.date)}</Text>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            currency={settings.currency}
            onPress={() => router.push({ pathname: '/transaction', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: t.muted }]}>No transactions this month.{'\n'}Tap a button below to add one.</Text>
        }
      />

      <View style={styles.fabRow}>
        <Fab label="Income" icon="plus" color={t.income} onPress={() => add('income')} />
        <Fab label="Expense" icon="minus" color={t.expense} onPress={() => add('expense')} />
      </View>
    </View>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

function Fab({ label, icon, color, onPress }: { label: string; icon: 'plus' | 'minus'; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: color, opacity: pressed ? 0.8 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Add ${label.toLowerCase()}`}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: { marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 16 },
  balanceLabel: { fontSize: 13 },
  balance: { fontSize: 30, fontWeight: '800', marginVertical: 4, fontVariant: ['tabular-nums'] },
  summaryRow: { flexDirection: 'row', marginTop: 8 },
  dayHeader: { fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: 48, lineHeight: 22 },
  fabRow: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', gap: 12 },
  fab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 28, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
