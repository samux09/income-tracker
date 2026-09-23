import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { exportBackup, pickBackup } from '../../lib/backup';
import { confirm, notify } from '../../lib/confirm';
import { CURRENCIES } from '../../lib/money';
import { useStore } from '../../store/StoreProvider';
import { useTheme } from '../../theme';

export default function SettingsScreen() {
  const t = useTheme();
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
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
                <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600' }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.heading, { color: t.text }]}>Backup</Text>
        <Text style={{ color: t.muted, marginBottom: 12 }}>
          Your data is stored only on this device. Export a backup regularly, and use it to move your data to another device.
        </Text>
        <Pressable style={[styles.button, { backgroundColor: t.primary }]} onPress={onExport}>
          <Text style={styles.buttonText}>Export backup (JSON)</Text>
        </Pressable>
        <Pressable style={[styles.button, { borderColor: t.primary, borderWidth: 1, marginTop: 8 }]} onPress={onImport}>
          <Text style={[styles.buttonText, { color: t.primary }]}>Import backup…</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
