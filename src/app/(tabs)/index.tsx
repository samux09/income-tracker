import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { arrowDown, balanceChevron } from '../../assets/figma';
import { EXPENSE_CATEGORIES, getCategory } from '../../categories';
import { MonthSheet } from '../../components/Pickers';
import { TealBackground } from '../../components/TealHeader';
import { TransactionRow } from '../../components/TransactionRow';
import { CategoryTile, SectionHeader } from '../../components/ui';
import { formatMonthLabel, money } from '../../lib/money';
import { frequentCategories, groupByDay, inMonth, summarize } from '../../lib/stats';
import { useMonth } from '../../store/useMonth';
import { useStore } from '../../store/StoreProvider';
import { brand, font, useTheme } from '../../theme';

const HISTORY_ROWS = 4;
const QUICK_ADD = 5;

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 19 ? 'Good afternoon,' : 'Good evening,';
}

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { loaded, transactions, settings } = useStore();
  const [month, setMonth] = useMonth();
  const [showTotals, setShowTotals] = useState(true);
  const [picking, setPicking] = useState(false);

  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTxs), [monthTxs]);
  const recent = useMemo(() => groupByDay(monthTxs).flatMap((g) => g.data).slice(0, HISTORY_ROWS), [monthTxs]);
  const quick = useMemo(() => {
    const used = frequentCategories(transactions, QUICK_ADD);
    const fill = EXPENSE_CATEGORIES.map((c) => c.id).filter((id) => !used.includes(id));
    return [...used, ...fill].slice(0, QUICK_ADD);
  }, [transactions]);

  if (!loaded) return <ActivityIndicator style={{ marginTop: 48 }} />;

  const cur = settings.currency;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
      <TealBackground />
      <View style={[styles.top, { marginTop: insets.top + 28 }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {settings.name || 'Your finances'}
          </Text>
        </View>
        <Pressable onPress={() => setPicking(true)} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Change month">
          <MaterialCommunityIcons name="calendar-month-outline" size={23} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={{ gap: 8 }}>
          <View style={styles.cardTop}>
            <Pressable
              onPress={() => setShowTotals((v) => !v)}
              style={styles.balanceToggle}
              accessibilityRole="button"
              accessibilityLabel={showTotals ? 'Hide income and expenses' : 'Show income and expenses'}
            >
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <SvgXml xml={balanceChevron} width={18} height={18} style={{ transform: [{ scaleY: showTotals ? -1 : 1 }] }} />
            </Pressable>
            <Pressable onPress={() => setPicking(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Change month">
              <Text style={styles.cardMonth}>{formatMonthLabel(month)}</Text>
            </Pressable>
          </View>
          <Text style={styles.balance}>{money(summary.balance, cur)}</Text>
        </View>

        {showTotals ? (
          <View style={styles.totals}>
            <Total label="Income" value={money(summary.income, cur)} />
            <Total label="Expenses" value={money(summary.expenses, cur)} up alignEnd />
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 20, gap: 4 }}>
        <SectionHeader title="Transactions History" action="See all" onAction={() => router.navigate('/wallet')} />
        {recent.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} currency={cur} />
        ))}
        {recent.length === 0 ? (
          <Text style={[styles.empty, { color: t.muted }]}>No transactions this month.{'\n'}Tap + to add one.</Text>
        ) : null}
      </View>

      <View style={{ marginTop: 14, gap: 10 }}>
        <SectionHeader
          title="Quick Add"
          action="See all"
          onAction={() => router.push({ pathname: '/transaction', params: { type: 'expense', pick: '1' } })}
        />
        <View style={styles.quick}>
          {quick.map((id) => {
            const cat = getCategory(id);
            return (
              <Pressable
                key={id}
                onPress={() => router.push({ pathname: '/transaction', params: { type: 'expense', categoryId: id } })}
                accessibilityRole="button"
                accessibilityLabel={`Add ${cat.label} expense`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <CategoryTile categoryId={id} size={62} iconSize={28} radius={31} background={cat.color + '1F'} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <MonthSheet visible={picking} value={month} onChange={setMonth} onClose={() => setPicking(false)} />
    </ScrollView>
  );
}

function Total({ label, value, up, alignEnd }: { label: string; value: string; up?: boolean; alignEnd?: boolean }) {
  return (
    <View style={{ gap: 6, alignItems: alignEnd ? 'flex-end' : 'flex-start' }}>
      <View style={styles.totalLabelRow}>
        <View style={[styles.arrow, up && { transform: [{ scaleY: -1 }] }]}>
          <SvgXml xml={arrowDown} width={18} height={18} />
        </View>
        <Text style={styles.totalLabel}>{label}</Text>
      </View>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  greeting: { color: '#FFFFFF', fontFamily: font.medium, fontSize: 14 },
  name: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 20 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 33,
    marginHorizontal: 20,
    minHeight: 201,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 24,
    borderRadius: 20,
    backgroundColor: brand.card,
    justifyContent: 'space-between',
    // The design uses a blurred #1B5C58 rectangle under the lower half of the card.
    boxShadow: '0px 24px 44px -14px rgba(27, 92, 88, 0.85)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceToggle: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 24 },
  balanceLabel: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.32 },
  cardMonth: { color: brand.cardLabel, fontFamily: font.medium, fontSize: 12, textTransform: 'capitalize' },
  balance: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 30, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  totalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { color: brand.cardLabel, fontFamily: font.medium, fontSize: 16, letterSpacing: -0.8 },
  totalValue: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 20, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  empty: { textAlign: 'center', marginVertical: 24, lineHeight: 22, fontFamily: font.regular },
  quick: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22 },
});
