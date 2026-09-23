import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { AppData, Transaction } from '../types';

export async function exportBackup(data: AppData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const name = `income-tracker-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save backup' });
}

/** Returns parsed data, or null if the user cancelled. Throws on invalid files. */
export async function pickBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : new File(asset.uri).textSync();
  return validate(JSON.parse(text));
}

function validate(raw: unknown): AppData {
  const d = raw as Partial<AppData>;
  if (!d || !Array.isArray(d.transactions)) throw new Error('This file is not an Income Tracker backup.');
  const transactions = d.transactions.filter(
    (t: Transaction) =>
      t && typeof t.id === 'string' && (t.type === 'income' || t.type === 'expense') &&
      typeof t.amount === 'number' && typeof t.date === 'string' && typeof t.categoryId === 'string',
  );
  return { version: 1, transactions, settings: { currency: d.settings?.currency ?? 'USD' } };
}
