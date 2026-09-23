import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { chevronDownDark, download, sort } from '../../assets/figma';
import { getCategory } from '../../categories';
import { LineChart } from '../../components/LineChart';
import { BarButton, TitleBar } from '../../components/TealHeader';
import { CategoryTile } from '../../components/ui';
import { exportBackup } from '../../lib/backup';
import { notify } from '../../lib/confirm';
import { formatDateLabel, formatMonthLabel, money } from '../../lib/money';
import { bucketTotals, inRange, periodBuckets, totalsByCategory, type Bucket, type Granularity } from '../../lib/stats';
import { useStore } from '../../store/StoreProvider';
import { brand, font, useTheme } from '../../theme';
import type { TransactionType } from '../../types';

const PERIODS: [Granularity, string, string][] = [
  ['day', 'Day', 'Last 30 days'],
  ['week', 'Week', 'Last 12 weeks'],
  ['month', 'Month', 'Last 12 months'],
  ['year', 'Year', 'Last 5 years'],
];

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const short = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString(undefined, opts).replace('.', '');

function axisLabel(g: Granularity, b: Bucket): string {
  const d = parse(b.start);
  if (g === 'day') return String(d.getDate());
  if (g === 'week') return short(d, { month: 'short', day: 'numeric' });
  if (g === 'month') return short(d, { month: 'short' });
  return String(d.getFullYear());
}

function periodTitle(g: Granularity, b: Bucket): string {
  if (g === 'day') return formatDateLabel(b.start);
  if (g === 'week') return `Week of ${short(parse(b.start), { month: 'short', day: 'numeric' })}`;
  if (g === 'month') return formatMonthLabel(b.start.slice(0, 7));
  return b.start.slice(0, 4);
}

export default function StatsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions, settings, exportData } = useStore();
  const [period, setPeriod] = useState<Granularity>('month');
  const [type, setType] = useState<TransactionType>('expense');
  const [ascending, setAscending] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  // White screen: dark status bar icons while focused.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => setStatusBarStyle('light');
    }, []),
  );

  const buckets = useMemo(() => periodBuckets(period, new Date()), [period]);
  const values = useMemo(() => bucketTotals(transactions, buckets, type), [transactions, buckets, type]);
  const labels = useMemo(() => buckets.map((b) => axisLabel(period, b)), [buckets, period]);
  const selected = Math.min(picked ?? buckets.length - 1, buckets.length - 1);
  const bucket = buckets[selected];

  const bucketTxs = useMemo(() => inRange(transactions, bucket), [transactions, bucket]);
  const totals = useMemo(() => totalsByCategory(bucketTxs, type), [bucketTxs, type]);
  const rows = ascending ? [...totals].reverse() : totals;
  const topId = totals[0]?.categoryId;

  const onExport = async () => {
    try {
      await exportBackup(exportData());
    } catch (e) {
      notify('Export failed', String(e));
    }
  };

  const cur = settings.currency;
  const sign = type === 'income' ? '+' : '-';
  const title = periodTitle(period, bucket);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
      <TitleBar
        title="Statistics"
        color={t.text}
        right={
          <BarButton onPress={onExport} label="Export backup">
            <SvgXml xml={download} width={28} height={28} />
          </BarButton>
        }
      />

      <View style={styles.periods} accessibilityRole="tablist">
        {PERIODS.map(([key, label]) => {
          const active = key === period;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setPeriod(key);
                setPicked(null);
              }}
              style={[styles.period, active && { backgroundColor: t.primary, width: 90 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.periodText, { color: active ? '#FFFFFF' : t.muted }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.controls}>
        <Text style={[styles.range, { color: t.text }]}>{PERIODS.find((p) => p[0] === period)?.[2]}</Text>
        <Pressable
          onPress={() => setType(type === 'expense' ? 'income' : 'expense')}
          style={[styles.dropdown, { borderColor: t.muted }]}
          accessibilityRole="button"
          accessibilityLabel={`Showing ${type}. Switch to ${type === 'expense' ? 'income' : 'expense'}`}
        >
          <Text style={[styles.dropdownText, { color: t.muted }]}>{type === 'expense' ? 'Expense' : 'Income'}</Text>
          <SvgXml xml={chevronDownDark} width={20} height={20} />
        </Pressable>
      </View>

      <View style={{ marginTop: 8 }}>
        <LineChart values={values} labels={labels} selected={selected} onSelect={setPicked} formatValue={(v) => money(v, cur, true)} />
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.section, { color: t.text }]}>{type === 'expense' ? 'Top Spending' : 'Top Income'}</Text>
        <Pressable onPress={() => setAscending((v) => !v)} style={styles.sortBtn} accessibilityRole="button" accessibilityLabel="Reverse sort order">
          <SvgXml xml={sort} width={21} height={21} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {rows.length === 0 ? (
          <Text style={[styles.empty, { color: t.muted }]}>
            No {type === 'expense' ? 'expenses' : 'income'} in {title}.
          </Text>
        ) : null}
        {rows.map((item) => {
          const cat = getCategory(item.categoryId);
          const top = item.categoryId === topId;
          return (
            <View key={item.categoryId} style={[styles.row, { backgroundColor: top ? brand.highlight : t.row }, top && styles.rowTop]}>
              <CategoryTile categoryId={item.categoryId} background={top ? 'rgba(255, 255, 255, 0.14)' : t.tile} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.rowTitle, { color: top ? '#FFFFFF' : t.title }]} numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text style={[styles.rowSub, { color: top ? '#EEEEEE' : t.muted }]} numberOfLines={1}>
                  {title} · {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
              <Text style={[styles.rowAmount, { color: top ? '#FFFFFF' : type === 'income' ? t.income : t.expense }]}>
                {sign} {money(item.total, cur)}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  periods: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 32 },
  period: { minWidth: 70, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  periodText: { fontFamily: font.regular, fontSize: 13 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, paddingHorizontal: 24 },
  range: { fontFamily: font.medium, fontSize: 14 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: 120, height: 40, borderWidth: 1, borderRadius: 10 },
  dropdownText: { fontFamily: font.medium, fontSize: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 12, paddingLeft: 22, paddingRight: 10 },
  section: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.36 },
  sortBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginVertical: 16, fontFamily: font.regular },
  list: { paddingHorizontal: 20, gap: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 12 },
  rowTop: { boxShadow: '0px 30px 20px -12px rgba(41, 117, 111, 0.35)' },
  rowTitle: { fontFamily: font.medium, fontSize: 16, letterSpacing: -0.32 },
  rowSub: { fontFamily: font.regular, fontSize: 13, letterSpacing: -0.26 },
  rowAmount: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.72, fontVariant: ['tabular-nums'] },
});
