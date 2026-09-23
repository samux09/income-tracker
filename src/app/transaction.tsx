import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { calendar, chevronDown, plusCircle } from '../assets/figma';
import { categoriesFor, getCategory } from '../categories';
import { TealBackground, TealTitleBar } from '../components/TealHeader';
import { confirm } from '../lib/confirm';
import { formatDateLabel, parseAmount } from '../lib/money';
import { toISODate } from '../lib/stats';
import { useStore } from '../store/StoreProvider';
import { font, useTheme } from '../theme';
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
  const [focused, setFocused] = useState<'amount' | 'date' | 'note' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(!existing);
  const [noteOpen, setNoteOpen] = useState(Boolean(existing?.note));

  const categories = categoriesFor(type);
  const category = categoryId ? getCategory(categoryId) : null;

  const switchType = (next: TransactionType) => {
    setType(next);
    if (!categoriesFor(next).some((c) => c.id === categoryId)) {
      setCategoryId(null);
      setPickerOpen(true);
    }
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

  const now = new Date();
  const today = toISODate(now);
  const yesterday = toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const validDate = ISO_DATE.test(date) && !Number.isNaN(Date.parse(date));
  const title = existing ? 'Edit Transaction' : type === 'income' ? 'Add Income' : 'Add Expense';
  const box = (active: boolean) => [styles.box, { borderColor: active ? t.primary : t.border, borderWidth: active ? 1.4 : 1 }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <TealBackground />
        <TealTitleBar
          title={title}
          onBack={() => router.back()}
          right={
            existing ? (
              <Pressable onPress={remove} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete transaction">
                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFFFFF" />
              </Pressable>
            ) : null
          }
        />

        <View style={[styles.card, { backgroundColor: t.card }]}>
          <View style={[styles.segment, { borderColor: t.border }]}>
            {(['expense', 'income'] as const).map((k) => {
              const active = type === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => switchType(k)}
                  style={[styles.segmentBtn, active && { backgroundColor: t.primary }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : t.muted }]}>
                    {k === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: t.muted }]}>CATEGORY</Text>
          <Pressable onPress={() => setPickerOpen((v) => !v)} style={box(pickerOpen)} accessibilityRole="button">
            <View style={[styles.catBadge, { backgroundColor: category ? category.color : t.tile }]}>
              <MaterialCommunityIcons name={category?.icon ?? 'shape-outline'} size={18} color={category ? '#FFFFFF' : t.muted} />
            </View>
            <Text style={[styles.value, { color: t.muted, flex: 1, marginLeft: 15 }]}>{category?.label ?? 'Choose a category'}</Text>
            <SvgXml xml={chevronDown} width={20} height={20} style={{ transform: [{ scaleY: pickerOpen ? -1 : 1 }] }} />
          </Pressable>
          {pickerOpen ? (
            <View style={styles.grid}>
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setCategoryId(c.id);
                      setPickerOpen(false);
                    }}
                    style={[styles.cat, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.tile : t.card }]}
                  >
                    <MaterialCommunityIcons name={c.icon} size={22} color={c.color} />
                    <Text style={[styles.catLabel, { color: t.text }]} numberOfLines={2}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text style={[styles.label, { color: t.muted }]}>AMOUNT</Text>
          <View style={box(focused === 'amount')}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              onFocus={() => setFocused('amount')}
              onBlur={() => setFocused(null)}
              placeholder="0.00"
              placeholderTextColor={t.border}
              keyboardType="decimal-pad"
              autoFocus={!existing}
              style={[styles.input, styles.amount, { color: t.primary }]}
            />
            {amount ? (
              <Pressable onPress={() => setAmount('')} hitSlop={10} accessibilityRole="button">
                <Text style={[styles.clear, { color: t.primary }]}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.label, { color: t.muted }]}>DATE</Text>
          <View style={box(focused === 'date')}>
            <TextInput
              value={date}
              onChangeText={setDate}
              onFocus={() => setFocused('date')}
              onBlur={() => setFocused(null)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={t.border}
              style={[styles.input, styles.value, { color: t.muted }]}
            />
            <SvgXml xml={calendar} width={20} height={20} />
          </View>
          <View style={styles.dateRow}>
            <Text style={[styles.hint, { color: t.muted }]}>{validDate ? formatDateLabel(date) : ' '}</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <QuickDate label="Today" active={date === today} onPress={() => setDate(today)} />
              <QuickDate label="Yesterday" active={date === yesterday} onPress={() => setDate(yesterday)} />
            </View>
          </View>

          <Text style={[styles.label, { color: t.muted, marginTop: 14 }]}>NOTE</Text>
          {noteOpen || note ? (
            <View style={[box(focused === 'note'), styles.dashed]}>
              <TextInput
                value={note}
                onChangeText={setNote}
                onFocus={() => setFocused('note')}
                onBlur={() => setFocused(null)}
                autoFocus={noteOpen && !note}
                placeholder="e.g. Shell station on 5th Ave"
                placeholderTextColor={t.border}
                style={[styles.input, styles.value, { color: t.muted }]}
              />
            </View>
          ) : (
            <Pressable onPress={() => setNoteOpen(true)} style={[box(false), styles.dashed, styles.addNote]} accessibilityRole="button">
              <SvgXml xml={plusCircle} width={24} height={24} />
              <Text style={[styles.addNoteText, { color: t.muted }]}>Add Note</Text>
            </Pressable>
          )}

          {error ? <Text style={[styles.error, { color: t.expense }]}>{error}</Text> : null}

          <Pressable onPress={save} style={({ pressed }) => [styles.save, { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuickDate({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.quick, { color: active ? t.primary : t.muted, fontFamily: active ? font.semibold : font.medium }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 56,
    marginHorizontal: 28,
    padding: 20,
    paddingTop: 30,
    borderRadius: 20,
    boxShadow: '0px 22px 35px rgba(0, 0, 0, 0.08)',
  },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 4, marginBottom: 6 },
  segmentBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontFamily: font.medium, fontSize: 14 },
  label: { fontFamily: font.medium, fontSize: 12, letterSpacing: 0.72, marginTop: 24, marginBottom: 10 },
  box: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 8, paddingLeft: 20, paddingRight: 15 },
  dashed: { borderStyle: 'dashed' },
  catBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: -1 },
  input: { flex: 1, height: '100%', padding: 0 },
  value: { fontFamily: font.medium, fontSize: 14, letterSpacing: -0.14 },
  amount: { fontFamily: font.semibold, fontSize: 14, letterSpacing: -0.14 },
  clear: { fontFamily: font.medium, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  cat: { width: '31%', flexGrow: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, gap: 4 },
  catLabel: { fontFamily: font.regular, fontSize: 12, textAlign: 'center' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  hint: { fontFamily: font.regular, fontSize: 12 },
  quick: { fontSize: 12 },
  addNote: { justifyContent: 'center', gap: 12, paddingLeft: 0, paddingRight: 0 },
  addNoteText: { fontFamily: font.medium, fontSize: 14, letterSpacing: 0.84 },
  error: { fontFamily: font.semibold, marginTop: 16 },
  save: { marginTop: 24, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontFamily: font.semibold, fontSize: 16 },
});
