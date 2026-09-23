import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategory } from '../categories';
import { OptionsSheet } from '../components/Pickers';
import { BarButton, TealBackground, TitleBar } from '../components/TealHeader';
import { CategoryTile, OutlineButton } from '../components/ui';
import { confirm } from '../lib/confirm';
import { formatMonthLabel, money, signedMoney } from '../lib/money';
import { useStore } from '../store/StoreProvider';
import { brand, font, useTheme } from '../theme';

function fullDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DetailsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, settings, deleteTransaction } = useStore();
  const tx = transactions.find((x) => x.id === id);
  const [expanded, setExpanded] = useState(true);
  const [menu, setMenu] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!tx) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <TealBackground />
        <TitleBar title="Transaction Details" onBack={back} />
        <Text style={[styles.missing, { color: t.muted }]}>This transaction no longer exists.</Text>
      </View>
    );
  }

  const cat = getCategory(tx.categoryId);
  const income = tx.type === 'income';
  const statusColor = income ? t.primary : brand.expenseBadgeText;
  const edit = () => router.push({ pathname: '/transaction', params: { id: tx.id } });
  const remove = async () => {
    if (await confirm('Delete transaction?', 'This cannot be undone.', 'Delete')) {
      deleteTransaction(tx.id);
      back();
    }
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
      <TealBackground />
      <TitleBar
        title="Transaction Details"
        onBack={back}
        right={
          <BarButton onPress={() => setMenu(true)} label="More options">
            <MaterialCommunityIcons name="dots-horizontal" size={30} color="#FFFFFF" />
          </BarButton>
        }
      />

      <View style={[styles.sheet, { backgroundColor: t.card }]}>
        <View style={styles.hero}>
          <CategoryTile categoryId={tx.categoryId} size={80} iconSize={40} radius={40} />
          <View style={[styles.badge, { backgroundColor: income ? brand.incomeBadgeBg : brand.expenseBadgeBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{income ? 'Income' : 'Expense'}</Text>
          </View>
          <Text style={[styles.amount, { color: t.title }]}>{money(tx.amount, settings.currency)}</Text>
        </View>

        <View style={styles.details}>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={styles.detailsHead}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={[styles.detailsTitle, { color: t.title }]}>Transaction details</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={t.text} />
          </Pressable>

          {expanded ? (
            <>
              <Row label="Status" value={income ? 'Income' : 'Expense'} color={statusColor} />
              <Row label="Category" value={cat.label} />
              {tx.note ? <Row label="Note" value={tx.note} /> : null}
              <Row label="Date" value={fullDate(tx.date)} />
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <Row label="Added" value={tx.source === 'auto' ? 'Auto-detected' : 'Manually'} />
              <Row label="Month" value={formatMonthLabel(tx.date.slice(0, 7))} />
              <View style={[styles.divider, { backgroundColor: t.border }]} />
            </>
          ) : null}
          <Row label="Total" value={signedMoney(tx, settings.currency)} strong />
        </View>

        <OutlineButton label="Edit Transaction" onPress={edit} style={{ marginTop: 36 }} />
      </View>

      <OptionsSheet
        visible={menu}
        onClose={() => setMenu(false)}
        options={[
          { label: 'Edit transaction', icon: 'pencil-outline', onPress: edit },
          { label: 'Delete transaction', icon: 'trash-can-outline', destructive: true, onPress: remove },
        ]}
      />
    </ScrollView>
  );
}

function Row({ label, value, color, strong }: { label: string; value: string; color?: string; strong?: boolean }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: strong ? t.text : t.muted }, strong && { fontFamily: font.medium }]}>{label}</Text>
      <Text
        style={[styles.rowValue, { color: color ?? t.title }, strong && { fontFamily: font.semibold }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { marginTop: 180, textAlign: 'center', fontFamily: font.regular, fontSize: 15 },
  sheet: { marginTop: 41, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 30, paddingHorizontal: 31 },
  hero: { alignItems: 'center', gap: 12 },
  badge: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: font.medium, fontSize: 14 },
  amount: { fontFamily: font.semibold, fontSize: 24, fontVariant: ['tabular-nums'] },
  details: { marginTop: 30, gap: 14 },
  detailsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  detailsTitle: { fontFamily: font.medium, fontSize: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  rowLabel: { fontFamily: font.regular, fontSize: 16 },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: font.regular, fontSize: 16 },
  divider: { height: 1 },
});
