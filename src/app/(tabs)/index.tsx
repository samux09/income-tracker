import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { arrowDown, balanceChevron, cardDots } from '../../assets/figma';
import { TealBackground } from '../../components/TealHeader';
import { TransactionRow } from '../../components/TransactionRow';
import { formatMoney, formatMonthLabel } from '../../lib/money';
import { groupByDay, inMonth, shiftMonth, summarize } from '../../lib/stats';
import { useMonth } from '../../store/useMonth';
import { useStore } from '../../store/StoreProvider';
import { brand, font, useTheme } from '../../theme';

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

  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTxs), [monthTxs]);
  const sorted = useMemo(() => groupByDay(monthTxs).flatMap((g) => g.data), [monthTxs]);

  if (!loaded) return <ActivityIndicator style={{ marginTop: 48 }} />;

  const money = (n: number) => formatMoney(n, settings.currency);

  const header = (
    <View>
      <TealBackground />
      <View style={[styles.top, { marginTop: insets.top + 30 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.month}>{formatMonthLabel(month)}</Text>
        </View>
        <HeaderButton icon="chevron-left" label="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} />
        <HeaderButton icon="chevron-right" label="Next month" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>

      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Pressable
              onPress={() => setShowTotals((v) => !v)}
              style={styles.balanceToggle}
              accessibilityRole="button"
              accessibilityLabel={showTotals ? 'Hide income and expenses' : 'Show income and expenses'}
            >
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <SvgXml
                xml={balanceChevron}
                width={18}
                height={18}
                style={{ transform: [{ scaleY: showTotals ? -1 : 1 }] }}
              />
            </Pressable>
            <SvgXml xml={cardDots} width={21} height={5} />
          </View>
          <Text style={styles.balance}>{money(summary.balance)}</Text>

          {showTotals ? (
            <View style={styles.totals}>
              <View>
                <View style={styles.totalLabelRow}>
                  <View style={styles.arrow}>
                    <SvgXml xml={arrowDown} width={18} height={18} />
                  </View>
                  <Text style={styles.totalLabel}>Income</Text>
                </View>
                <Text style={styles.totalValue}>{money(summary.income)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.totalLabelRow}>
                  <View style={[styles.arrow, { transform: [{ scaleY: -1 }] }]}>
                    <SvgXml xml={arrowDown} width={18} height={18} />
                  </View>
                  <Text style={[styles.totalLabel, { fontSize: 18, letterSpacing: -0.9 }]}>Expenses</Text>
                </View>
                <Text style={styles.totalValue}>{money(summary.expenses)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.section, { color: t.text }]}>Transactions History</Text>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      data={sorted}
      keyExtractor={(tx) => tx.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      renderItem={({ item }) => (
        <TransactionRow
          tx={item}
          currency={settings.currency}
          onPress={() => router.push({ pathname: '/transaction', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: t.muted }]}>No transactions this month.{'\n'}Tap + to add one.</Text>
      }
    />
  );
}

function HeaderButton({ icon, label, onPress }: { icon: 'chevron-left' | 'chevron-right'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}>
      <MaterialCommunityIcons name={icon} size={23} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 24, paddingRight: 24 },
  greeting: { color: '#FFFFFF', fontFamily: font.medium, fontSize: 14 },
  month: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 20, marginTop: 6, textTransform: 'capitalize' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 6.667,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: { marginTop: 37, marginHorizontal: 20 },
  // The design uses a blurred #1B5C58 rectangle under the lower half of the card.
  card: {
    backgroundColor: brand.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
    boxShadow: '0px 24px 48px -12px rgba(27, 92, 88, 0.8)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  balanceLabel: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.32 },
  balance: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 30, letterSpacing: -1.5, marginTop: 8, fontVariant: ['tabular-nums'] },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 29 },
  totalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: { color: brand.cardLabel, fontFamily: font.medium, fontSize: 16, letterSpacing: -0.8 },
  totalValue: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 20, letterSpacing: -1, marginTop: 6, fontVariant: ['tabular-nums'] },
  section: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.36, marginTop: 31, marginBottom: 11, marginHorizontal: 22 },
  empty: { textAlign: 'center', marginTop: 32, lineHeight: 22, fontFamily: font.regular },
});
