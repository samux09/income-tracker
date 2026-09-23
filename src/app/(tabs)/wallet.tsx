import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TealBackground, TitleBar } from '../../components/TealHeader';
import { TransactionRow } from '../../components/TransactionRow';
import { TypeSwitch } from '../../components/ui';
import { exportBackup } from '../../lib/backup';
import { notify } from '../../lib/confirm';
import { money } from '../../lib/money';
import { groupByDay, summarize } from '../../lib/stats';
import { useStore } from '../../store/StoreProvider';
import { font, useTheme } from '../../theme';
import type { TransactionType } from '../../types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function WalletScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions, settings, exportData } = useStore();
  const [type, setType] = useState<TransactionType>('expense');

  const balance = useMemo(() => summarize(transactions).balance, [transactions]);
  const list = useMemo(
    () => groupByDay(transactions.filter((tx) => tx.type === type)).flatMap((g) => g.data),
    [transactions, type],
  );

  const onExport = async () => {
    try {
      await exportBackup(exportData());
    } catch (e) {
      notify('Export failed', String(e));
    }
  };

  const header = (
    <View>
      <TealBackground />
      <TitleBar title="Wallet" onBack={() => router.navigate('/')} />
      <View style={[styles.sheet, { backgroundColor: t.card }]}>
        <Text style={[styles.balanceLabel, { color: t.muted }]}>Total Balance</Text>
        <Text style={[styles.balance, { color: t.text }]}>{money(balance, settings.currency)}</Text>
        <View style={styles.actions}>
          <Action icon="plus" label="Expense" onPress={() => router.push({ pathname: '/transaction', params: { type: 'expense' } })} />
          <Action icon="arrow-down" label="Income" onPress={() => router.push({ pathname: '/transaction', params: { type: 'income' } })} />
          <Action icon="tray-arrow-down" label="Export" onPress={onExport} />
        </View>
        <View style={styles.switch}>
          <TypeSwitch value={type} onChange={setType} />
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      data={list}
      keyExtractor={(tx) => tx.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => <TransactionRow tx={item} currency={settings.currency} />}
      contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: t.muted }]}>
          No {type === 'expense' ? 'expenses' : 'income'} yet.{'\n'}Tap + to add one.
        </Text>
      }
    />
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.actionCircle, { borderColor: t.primary }]}>
        <MaterialCommunityIcons name={icon} size={26} color={t.primary} />
      </View>
      <Text style={[styles.actionLabel, { color: t.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: { marginTop: 41, borderTopLeftRadius: 40, borderTopRightRadius: 40, alignItems: 'center', paddingTop: 50, paddingBottom: 12 },
  balanceLabel: { fontFamily: font.regular, fontSize: 16 },
  balance: { fontFamily: font.bold, fontSize: 30, letterSpacing: -1, marginTop: 10, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 30, marginTop: 38 },
  action: { alignItems: 'center', gap: 12 },
  actionCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: font.regular, fontSize: 14 },
  switch: { alignSelf: 'stretch', marginTop: 50, marginHorizontal: 20 },
  empty: { textAlign: 'center', marginTop: 24, lineHeight: 22, fontFamily: font.regular },
});
