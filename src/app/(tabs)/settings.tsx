import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TealBackground, TealTitleBar } from '../../components/TealHeader';
import { exportBackup, pickBackup } from '../../lib/backup';
import { confirm, notify } from '../../lib/confirm';
import { CURRENCIES } from '../../lib/money';
import { useStore } from '../../store/StoreProvider';
import { font, useTheme } from '../../theme';

export default function SettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, exportData, replaceAll, transactions } = useStore();

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

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
      <TealBackground />
      <TealTitleBar title="Settings" />
      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.heading, { color: t.text }]}>Currency</Text>
          <View style={styles.chips}>
            {CURRENCIES.map((c) => {
              const active = c === settings.currency;
              return (
                <Pressable
                  key={c}
                  onPress={() => updateSettings({ currency: c })}
                  style={[styles.chip, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : 'transparent' }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : t.muted }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.heading, { color: t.text }]}>Backup</Text>
          <Text style={[styles.body, { color: t.muted }]}>
            Your data is stored only on this device. Export a backup regularly, and use it to move your data to another device.
          </Text>
          <Pressable style={[styles.button, { backgroundColor: t.primary }]} onPress={onExport}>
            <Text style={styles.buttonText}>Export backup (JSON)</Text>
          </Pressable>
          <Pressable style={[styles.button, { borderColor: t.primary, borderWidth: 1, marginTop: 8 }]} onPress={onImport}>
            <Text style={[styles.buttonText, { color: t.primary }]}>Import backup…</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cards: { marginTop: 56, marginHorizontal: 28, gap: 20 },
  card: {
    padding: 20,
    borderRadius: 20,
    boxShadow: '0px 22px 35px rgba(0, 0, 0, 0.08)',
  },
  heading: { fontFamily: font.semibold, fontSize: 18, letterSpacing: -0.36, marginBottom: 12 },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontFamily: font.medium, fontSize: 13 },
  button: { height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontFamily: font.semibold, fontSize: 16 },
});
