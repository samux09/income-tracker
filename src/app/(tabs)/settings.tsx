import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptionsSheet } from '../../components/Pickers';
import { TealBackground, TitleBar } from '../../components/TealHeader';
import { exportBackup, pickBackup } from '../../lib/backup';
import { confirm, notify } from '../../lib/confirm';
import { CURRENCIES } from '../../lib/money';
import { useStore } from '../../store/StoreProvider';
import { font, useTheme } from '../../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, exportData, replaceAll, transactions } = useStore();
  // Draft only while editing, so the field always shows the saved name otherwise.
  const [draft, setDraft] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const saveName = () => {
    if (draft !== null) updateSettings({ name: draft.trim() || undefined });
    setDraft(null);
  };

  const onExport = async () => {
    try {
      await exportBackup(exportData());
    } catch (e) {
      notify('Export failed', String(e));
    }
  };

  const onImport = async () => {
    try {
      const data = await pickBackup();
      if (!data) return;
      const ok = await confirm(
        'Replace all data?',
        `The backup has ${data.transactions.length} transactions. Your current ${transactions.length} transactions will be replaced.`,
        'Replace',
      );
      if (ok) replaceAll(data);
    } catch (e) {
      notify('Import failed', e instanceof Error ? e.message : String(e));
    }
  };

  const onPrivacy = () =>
    notify(
      'Data and privacy',
      'Your transactions are stored only on this device. Nothing is sent to a server. Export a backup to keep a copy or move to another device.',
    );

  const onAbout = () => notify('Income Tracker', `Version ${Constants.expoConfig?.version ?? ''}`.trim());

  const letters = initials(settings.name ?? '');

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} keyboardShouldPersistTaps="handled">
      <TealBackground />
      <TitleBar title="Profile" onBack={() => router.navigate('/')} />

      <View style={[styles.avatar, { backgroundColor: t.tile, borderColor: t.card }]}>
        {letters ? (
          <Text style={[styles.avatarText, { color: t.primary }]}>{letters}</Text>
        ) : (
          <MaterialCommunityIcons name="account" size={60} color={t.primary} />
        )}
      </View>

      <View style={styles.identity}>
        <TextInput
          value={draft ?? settings.name ?? ''}
          onFocus={() => setDraft(settings.name ?? '')}
          onChangeText={setDraft}
          onBlur={saveName}
          onSubmitEditing={saveName}
          placeholder="Add your name"
          placeholderTextColor={t.muted}
          returnKeyType="done"
          style={[styles.name, { color: t.text }]}
          accessibilityLabel="Your name"
        />
        <Text style={[styles.subtitle, { color: t.primary }]}>Data saved on this device</Text>
      </View>

      <View style={styles.list}>
        <Pressable
          onPress={() => setCurrencyOpen(true)}
          style={[styles.featured, { borderBottomColor: t.divider }]}
          accessibilityRole="button"
          accessibilityLabel={`Currency, ${settings.currency}`}
        >
          <View style={[styles.featuredIcon, { backgroundColor: t.tile }]}>
            <MaterialCommunityIcons name="database-outline" size={26} color={t.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: t.title }]}>Currency</Text>
          <Text style={[styles.featuredValue, { color: t.primary }]}>{settings.currency}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={t.tabInactive} />
        </Pressable>

        <View style={{ paddingTop: 8 }}>
          <Row icon="tray-arrow-down" label="Export backup" value="JSON" onPress={onExport} />
          <Row icon="tray-arrow-up" label="Import backup" onPress={onImport} />
          <Row icon="shield-check" label="Data and privacy" onPress={onPrivacy} />
          <Row icon="information-outline" label="About Income Tracker" value={`v${Constants.expoConfig?.version ?? ''}`} onPress={onAbout} />
        </View>
      </View>

      <OptionsSheet
        visible={currencyOpen}
        title="Currency"
        onClose={() => setCurrencyOpen(false)}
        options={CURRENCIES.map((c) => ({
          label: c,
          selected: c === settings.currency,
          onPress: () => updateSettings({ currency: c }),
        }))}
      />
    </ScrollView>
  );
}

function Row({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]} accessibilityRole="button">
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={28} color={t.muted} />
      </View>
      <Text style={[styles.rowLabel, { color: t.title }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: t.muted }]}>{value}</Text> : null}
      <MaterialCommunityIcons name="chevron-right" size={22} color={t.tabInactive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center',
    marginTop: 87,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  },
  avatarText: { fontFamily: font.semibold, fontSize: 36 },
  identity: { alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 24 },
  name: { fontFamily: font.semibold, fontSize: 20, textAlign: 'center', minWidth: 200, padding: 0 },
  subtitle: { fontFamily: font.medium, fontSize: 14 },
  list: { marginTop: 30, marginHorizontal: 25 },
  featured: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 14, borderBottomWidth: 1 },
  featuredIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  featuredValue: { fontFamily: font.semibold, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 20, height: 60 },
  rowIcon: { width: 50, alignItems: 'center' },
  rowLabel: { flex: 1, fontFamily: font.medium, fontSize: 16 },
  rowValue: { fontFamily: font.regular, fontSize: 14 },
});
