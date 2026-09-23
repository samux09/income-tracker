import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../categories';
import { formatDateLabel, signedMoney } from '../lib/money';
import { toISODate } from '../lib/stats';
import { font, useTheme } from '../theme';
import type { Transaction } from '../types';
import { CategoryTile } from './ui';

export function relativeDay(iso: string): string {
  const now = new Date();
  if (iso === toISODate(now)) return 'Today';
  if (iso === toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return 'Yesterday';
  return formatDateLabel(iso);
}

/** Transaction history row: icon tile, title, date and signed amount. Opens the details screen. */
export function TransactionRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const t = useTheme();
  const cat = getCategory(tx.categoryId);
  const title = tx.note || cat.label;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/details', params: { id: tx.id } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${signedMoney(tx, currency)}, ${relativeDay(tx.date)}`}
    >
      <CategoryTile categoryId={tx.categoryId} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.title }]} numberOfLines={1}>
          {title}
          {tx.source === 'auto' ? '  ⚡' : ''}
        </Text>
        <Text style={[styles.sub, { color: t.muted }]} numberOfLines={1}>
          {relativeDay(tx.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: tx.type === 'income' ? t.income : t.expense }]}>{signedMoney(tx, currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 22, paddingVertical: 8 },
  body: { flex: 1, gap: 6 },
  title: { fontFamily: font.medium, fontSize: 16, letterSpacing: -0.32 },
  sub: { fontFamily: font.regular, fontSize: 13, letterSpacing: -0.26 },
  amount: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.72, fontVariant: ['tabular-nums'] },
});
