import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { categoriesFor } from '../categories';
import { confirm } from '../lib/confirm';
import { parseAmount } from '../lib/money';
import { toISODate } from '../lib/stats';
import { useStore } from '../store/StoreProvider';
import { useTheme } from '../theme';
import type { Transaction, TransactionType } from '../types';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function TransactionScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ id?: string; type?: TransactionType }>();
  const { transactions, saveTransaction, deleteTransaction } = useStore();
  const existing = params.id ? transactions.find((x) => x.id === params.id) : undefined;

  const [type, setType] = useState<TransactionType>(existing?.type ?? (params.type === 'income' ? 'income' : 'expense'));
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const categories = categoriesFor(type);
  const accent = type === 'income' ? t.income : t.expense;

  const switchType = (next: TransactionType) => {
    setType(next);
    if (!categoriesFor(next).some((c) => c.id === categoryId)) setCategoryId(null);
  };

  const save = () => {
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Enter an amount greater than 0.');
    if (!categoryId) return setError('Choose a category.');
    if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) return setError('Date must be YYYY-MM-DD.');

    const tx: Transaction = {
      id: existing?.id ?? newId(),
      type,
      amount: value,
      categoryId,
      date,
      note: note.trim() || undefined,
      source: existing?.source ?? 'manual',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    saveTransaction(tx);
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Delete transaction?', 'This cannot be undone.', 'Delete')) {
      deleteTransaction(existing.id);
      router.back();
    }
  };

  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86_400_000));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? 'Edit transaction' : type === 'income' ? 'New income' : 'New expense' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.segment, { backgroundColor: t.card }]}>
          {(['expense', 'income'] as const).map((k) => {
            const active = type === k;
            const color = k === 'income' ? t.income : t.expense;
            return (
              <Pressable key={k} onPress={() => switchType(k)} style={[styles.segmentBtn, active && { backgroundColor: color }]}>
                <Text style={{ color: active ? '#fff' : t.text, fontWeight: '700' }}>{k === 'income' ? 'Income' : 'Expense'}</Text>
              </Pressable>
            );
          })}
        </View>

        <View>
          <Text style={[styles.label, { color: t.muted }]}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={t.muted}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            style={[styles.amountInput, { color: accent, backgroundColor: t.card, borderColor: t.border }]}
          />
        </View>

        <View>
          <Text style={[styles.label, { color: t.muted }]}>Category</Text>
          <View style={styles.grid}>
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  style={[styles.cat, { backgroundColor: t.card, borderColor: active ? c.color : t.border, borderWidth: active ? 2 : 1 }]}
                >
                  <MaterialCommunityIcons name={c.icon} size={24} color={c.color} />
                  <Text style={[styles.catLabel, { color: t.text }]} numberOfLines={2}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: t.muted }]}>Date</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={t.muted}
              style={[styles.input, { flex: 1, color: t.text, backgroundColor: t.card, borderColor: t.border }]}
            />
            <QuickChip label="Today" active={date === today} onPress={() => setDate(today)} />
            <QuickChip label="Yesterday" active={date === yesterday} onPress={() => setDate(yesterday)} />
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: t.muted }]}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Shell station on 5th Ave"
            placeholderTextColor={t.muted}
            style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.border }]}
          />
        </View>

        {error ? <Text style={{ color: t.expense, fontWeight: '600' }}>{error}</Text> : null}

        <Pressable onPress={save} style={({ pressed }) => [styles.save, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>

        {existing ? (
          <Pressable onPress={remove} style={styles.delete}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={t.expense} />
            <Text style={{ color: t.expense, fontWeight: '600' }}>Delete</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuickChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quick, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.card }]}
    >
      <Text style={{ color: active ? '#fff' : t.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  amountInput: { fontSize: 32, fontWeight: '800', padding: 14, borderRadius: 12, borderWidth: 1 },
  input: { fontSize: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { width: '31%', flexGrow: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, gap: 4 },
  catLabel: { fontSize: 12, textAlign: 'center' },
  quick: { justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  save: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  delete: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12 },
});
