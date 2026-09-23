import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { calendar, chevronDown } from '../assets/figma';
import { categoriesFor, getCategory } from '../categories';
import { CalendarSheet, CategorySheet } from '../components/Pickers';
import { TealBackground, TitleBar } from '../components/TealHeader';
import { PrimaryButton } from '../components/ui';
import { parseAmount } from '../lib/money';
import { toISODate } from '../lib/stats';
import { useStore } from '../store/StoreProvider';
import { font, useTheme } from '../theme';
import type { Transaction, TransactionType } from '../types';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TransactionScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ id?: string; type?: TransactionType; categoryId?: string; pick?: string }>();
  const { transactions, saveTransaction } = useStore();
  const existing = params.id ? transactions.find((x) => x.id === params.id) : undefined;
  const initialType: TransactionType = existing?.type ?? (params.type === 'income' ? 'income' : 'expense');
  const initialCategory =
    existing?.categoryId ?? (params.categoryId && categoriesFor(initialType).some((c) => c.id === params.categoryId) ? params.categoryId : null);

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');
  const [noteOpen, setNoteOpen] = useState(Boolean(existing?.note));
  const [amountFocused, setAmountFocused] = useState(false);
  const [sheet, setSheet] = useState<'category' | 'date' | null>(params.pick ? 'category' : null);
  const [error, setError] = useState<string | null>(null);

  const category = categoryId ? getCategory(categoryId) : null;
  const noun = type === 'income' ? 'Income' : 'Expense';

  const switchType = (next: TransactionType) => {
    setType(next);
    if (!categoriesFor(next).some((c) => c.id === categoryId)) setCategoryId(null);
  };

  const save = () => {
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Enter an amount greater than 0.');
    if (!categoryId) return setError('Choose a category.');

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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TealBackground />
        <TitleBar
          title={existing ? `Edit ${noun}` : `Add ${noun}`}
          onBack={() => router.back()}
          onTitlePress={() => switchType(type === 'expense' ? 'income' : 'expense')}
        />

        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Field label="CATEGORY">
            <Pressable
              onPress={() => setSheet('category')}
              style={[styles.box, { borderColor: t.border }]}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${category?.label ?? 'none'}`}
            >
              <View style={[styles.badge, { backgroundColor: category?.color ?? t.tile }]}>
                <MaterialCommunityIcons name={category?.icon ?? 'shape-outline'} size={18} color={category ? '#FFFFFF' : t.muted} />
              </View>
              <Text style={[styles.value, { color: t.muted, flex: 1 }]}>{category?.label ?? 'Choose a category'}</Text>
              <SvgXml xml={chevronDown} width={20} height={20} />
            </Pressable>
          </Field>

          <Field label="AMOUNT">
            <View style={[styles.box, { borderColor: amountFocused ? t.primary : t.border, borderWidth: amountFocused ? 1.4 : 1 }]}>
              <Text style={[styles.amount, { color: t.primary }]}>$</Text>
              <TextInput
                value={amount}
                onChangeText={(v) => {
                  setAmount(v);
                  setError(null);
                }}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                placeholder="0.00"
                placeholderTextColor={t.border}
                keyboardType="decimal-pad"
                autoFocus={!existing && !params.pick}
                style={[styles.input, styles.amount, { color: t.primary }]}
                accessibilityLabel="Amount"
              />
              {amount ? (
                <Pressable onPress={() => setAmount('')} style={styles.clear} accessibilityRole="button">
                  <Text style={[styles.clearText, { color: t.primary }]}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </Field>

          <Field label="DATE">
            <Pressable
              onPress={() => setSheet('date')}
              style={[styles.box, { borderColor: t.border }]}
              accessibilityRole="button"
              accessibilityLabel={`Date: ${longDate(date)}`}
            >
              <Text style={[styles.value, { color: t.muted, flex: 1 }]}>{longDate(date)}</Text>
              <SvgXml xml={calendar} width={20} height={20} />
            </Pressable>
          </Field>

          <Field label="NOTE">
            {noteOpen || note ? (
              <View style={[styles.box, styles.dashed, { borderColor: t.border }]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  autoFocus={noteOpen && !note}
                  placeholder="e.g. Walmart"
                  placeholderTextColor={t.border}
                  style={[styles.input, styles.value, { color: t.muted }]}
                  accessibilityLabel="Note"
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setNoteOpen(true)}
                style={[styles.box, styles.dashed, styles.addNote, { borderColor: t.border }]}
                accessibilityRole="button"
              >
                <View style={[styles.plus, { backgroundColor: t.muted }]}>
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.addNoteText, { color: t.muted }]}>Add Note</Text>
              </Pressable>
            )}
          </Field>

          {error ? <Text style={[styles.error, { color: t.expense }]}>{error}</Text> : null}
        </View>

        <PrimaryButton label={existing ? 'Save Changes' : `Save ${noun}`} onPress={save} style={styles.save} />
      </ScrollView>

      <CategorySheet
        visible={sheet === 'category'}
        type={type}
        selectedId={categoryId}
        onTypeChange={switchType}
        onSelect={(id) => {
          setCategoryId(id);
          setError(null);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      {sheet === 'date' ? <CalendarSheet visible value={date} onChange={setDate} onClose={() => setSheet(null)} /> : null}
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 41,
    marginHorizontal: 28,
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 20,
    gap: 24,
    boxShadow: '0px 22px 35px rgba(0, 0, 0, 0.08)',
  },
  label: { fontFamily: font.medium, fontSize: 12, letterSpacing: 0.72 },
  box: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 50, borderWidth: 1, borderRadius: 8, paddingLeft: 20, paddingRight: 16 },
  dashed: { borderStyle: 'dashed' },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.18)' },
  value: { fontFamily: font.medium, fontSize: 14, letterSpacing: -0.14 },
  amount: { fontFamily: font.semibold, fontSize: 14, letterSpacing: -0.14 },
  input: { flex: 1, height: '100%', padding: 0 },
  clear: { paddingVertical: 12 },
  clearText: { fontFamily: font.medium, fontSize: 12 },
  addNote: { justifyContent: 'center' },
  plus: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addNoteText: { fontFamily: font.medium, fontSize: 14, letterSpacing: 0.84 },
  error: { fontFamily: font.semibold, fontSize: 14, marginTop: -8 },
  save: { marginTop: 40, marginHorizontal: 28 },
});
