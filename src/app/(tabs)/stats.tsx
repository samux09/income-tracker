import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { chevronDownDark, download, sort } from '../../assets/figma';
import { getCategory } from '../../categories';
import { LineChart } from '../../components/LineChart';
import { exportBackup } from '../../lib/backup';
import { notify } from '../../lib/confirm';
import { formatMoney, formatMonthLabel } from '../../lib/money';
import { dailyTotals, inMonth, inYear, monthlyTotals, shiftMonth, toISODate, totalsByCategory } from '../../lib/stats';
import { useMonth } from '../../store/useMonth';
import { useStore } from '../../store/StoreProvider';
import { brand, font, useTheme } from '../../theme';
import type { TransactionType } from '../../types';

type Period = 'month' | 'year';

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'short' }).replace('.', ''),
);

export default function StatsScreen() {
  const t = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { transactions, settings, exportData } = useStore();
  const [month, setMonth] = useMonth();
  const [period, setPeriod] = useState<Period>('month');
  const [type, setType] = useState<TransactionType>('expense');
  const [ascending, setAscending] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  // White screen: dark status bar icons while focused.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(scheme === 'dark' ? 'light' : 'dark');
      return () => setStatusBarStyle('light');
    }, [scheme]),
  );

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;

  const values = useMemo(
    () => (period === 'month' ? dailyTotals(transactions, month, type) : monthlyTotals(transactions, year, type)),
    [transactions, month, year, period, type],
  );
  const labels = period === 'month' ? values.map((_, i) => String(i + 1)) : MONTH_LABELS;

  // Default selection: today (or the busiest day) in month view, the selected month in year view.
  const defaultIndex = useMemo(() => {
    if (period === 'year') return monthIndex;
    const today = toISODate(new Date());
    if (today.startsWith(month)) return Number(today.slice(8, 10)) - 1;
    return values.indexOf(Math.max(...values));
  }, [period, month, monthIndex, values]);
  const selected = picked ?? defaultIndex;

  const periodTxs = useMemo(
    () => (period === 'month' ? inMonth(transactions, month) : inYear(transactions, year)),
    [transactions, period, month, year],
  );
  const totals = useMemo(() => totalsByCategory(periodTxs, type), [periodTxs, type]);
  const rows = ascending ? [...totals].reverse() : totals;
  const topId = totals[0]?.categoryId;

  const changePeriod = (p: Period) => {
    setPeriod(p);
    setPicked(null);
  };
  const shift = (delta: number) => {
    setMonth(shiftMonth(month, period === 'month' ? delta : delta * 12));
    setPicked(null);
  };
  const onExport = async () => {
    try {
      await exportBackup(exportData());
    } catch (e) {
      notify('Export failed', String(e));
    }
  };

  const money = (n: number) => formatMoney(n, settings.currency);
  const sign = type === 'income' ? '+ ' : '- ';

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
      <View style={[styles.titleBar, { marginTop: insets.top + 37 }]}>
        <View style={styles.side} />
        <Text style={[styles.title, { color: t.text }]}>Statistics</Text>
        <Pressable onPress={onExport} style={[styles.side, { alignItems: 'flex-end' }]} hitSlop={8} accessibilityLabel="Export backup">
          <SvgXml xml={download.replace('fill="black"', `fill="${t.title}"`)} width={28} height={28} />
        </Pressable>
      </View>

      <View style={styles.periods}>
        {(['month', 'year'] as const).map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => changePeriod(p)}
              style={[styles.period, active && { backgroundColor: t.primary }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.periodText, { color: active ? '#FFFFFF' : t.muted }]}>{p === 'month' ? 'Month' : 'Year'}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.controls}>
        <View style={styles.switcher}>
          <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityLabel="Previous">
            <MaterialCommunityIcons name="chevron-left" size={24} color={t.muted} />
          </Pressable>
          <Text style={[styles.switcherLabel, { color: t.text }]}>{period === 'month' ? formatMonthLabel(month) : year}</Text>
          <Pressable onPress={() => shift(1)} hitSlop={10} accessibilityLabel="Next">
            <MaterialCommunityIcons name="chevron-right" size={24} color={t.muted} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => setType(type === 'expense' ? 'income' : 'expense')}
          style={[styles.dropdown, { borderColor: t.muted }]}
          accessibilityRole="button"
          accessibilityLabel={`Showing ${type}. Switch type`}
        >
          <Text style={[styles.dropdownText, { color: t.muted }]}>{type === 'expense' ? 'Expense' : 'Income'}</Text>
          <SvgXml xml={chevronDownDark} width={20} height={20} />
        </Pressable>
      </View>

      <LineChart
        values={values}
        labels={labels}
        selected={selected}
        onSelect={setPicked}
        formatValue={(v) => formatMoney(v, settings.currency, true)}
      />

      <View style={styles.sectionRow}>
        <Text style={[styles.section, { color: t.text }]}>{type === 'expense' ? 'Top Spending' : 'Top Income'}</Text>
        <Pressable onPress={() => setAscending((v) => !v)} hitSlop={10} accessibilityLabel="Reverse sort order">
          <SvgXml xml={sort} width={21} height={21} />
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: t.muted }]}>No {type === 'expense' ? 'expenses' : 'income'} in this period.</Text>
      ) : null}

      <View style={styles.list}>
        {rows.map((item) => {
          const cat = getCategory(item.categoryId);
          const top = item.categoryId === topId;
          return (
            <View key={item.categoryId} style={[styles.row, { backgroundColor: t.row }, top && styles.rowTop]}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name={cat.icon} size={30} color={top ? '#FFFFFF' : cat.color} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.rowTitle, { color: top ? '#FFFFFF' : t.title }]} numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text style={[styles.rowSub, { color: top ? '#EEEEEE' : t.muted }]}>
                  {(item.share * 100).toFixed(1)}% · {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
              <Text style={[styles.rowAmount, { color: top ? '#FFFFFF' : type === 'income' ? t.income : t.expense }]}>
                {sign}
                {money(item.total)}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, height: 28 },
  side: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontFamily: font.semibold, fontSize: 18 },
  periods: { flexDirection: 'row', gap: 12, marginTop: 40, paddingHorizontal: 32 },
  period: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  periodText: { fontFamily: font.regular, fontSize: 13 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    paddingLeft: 20,
    paddingRight: 24,
  },
  switcher: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switcherLabel: { fontFamily: font.medium, fontSize: 14, textTransform: 'capitalize' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: 120,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
  },
  dropdownText: { fontFamily: font.medium, fontSize: 14 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 45,
    marginBottom: 20,
    marginHorizontal: 22,
  },
  section: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.36 },
  empty: { textAlign: 'center', marginTop: 16, fontFamily: font.regular },
  list: { paddingHorizontal: 20, gap: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 12 },
  rowTop: {
    backgroundColor: brand.highlight,
    boxShadow: '0px 30px 20px -10px rgba(41, 117, 111, 0.35)',
  },
  rowIcon: { width: 50, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: font.medium, fontSize: 16, letterSpacing: -0.32 },
  rowSub: { fontFamily: font.regular, fontSize: 13, letterSpacing: -0.26 },
  rowAmount: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.72, fontVariant: ['tabular-nums'] },
});
