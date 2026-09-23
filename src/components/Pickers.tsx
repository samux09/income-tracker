import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoriesFor } from '../categories';
import { formatMonthLabel } from '../lib/money';
import { toISODate, type MonthKey } from '../lib/stats';
import { font, useTheme } from '../theme';
import type { TransactionType } from '../types';
import { Sheet } from './Sheet';
import { TypeSwitch } from './ui';

const monthName = (m: number) => new Date(2000, m, 1).toLocaleDateString(undefined, { month: 'short' }).replace('.', '');

// ---------------------------------------------------------------- categories

interface CategorySheetProps {
  visible: boolean;
  type: TransactionType;
  selectedId: string | null;
  onTypeChange: (type: TransactionType) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CategorySheet({ visible, type, selectedId, onTypeChange, onSelect, onClose }: CategorySheetProps) {
  const t = useTheme();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Choose category"
      accessory={<TypeSwitch value={type} onChange={onTypeChange} compact />}
    >
      <View style={styles.catGrid}>
        {categoriesFor(type).map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c.id)}
              style={styles.catCell}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.catCircle, { backgroundColor: c.color + '1F' }, active && { borderWidth: 2, borderColor: t.primary }]}>
                <MaterialCommunityIcons name={c.icon} size={26} color={c.color} />
              </View>
              <Text
                style={[styles.catLabel, { color: active ? t.primary : t.text, fontFamily: active ? font.semibold : font.regular }]}
                numberOfLines={2}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- date

interface CalendarSheetProps {
  visible: boolean;
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
}

export function CalendarSheet({ visible, value, onChange, onClose }: CalendarSheetProps) {
  const t = useTheme();
  const [y0, m0] = value.split('-').map(Number);
  const [view, setView] = useState({ y: y0, m: m0 - 1 });
  const today = toISODate(new Date());

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first grid
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (d: number) => setView(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const pick = (iso: string) => {
    onChange(iso);
    onClose();
  };
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose date">
      <View style={styles.navRow}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="Previous month">
          <MaterialCommunityIcons name="chevron-left" size={26} color={t.muted} />
        </Pressable>
        <Text style={[styles.navLabel, { color: t.text }]}>{formatMonthLabel(`${view.y}-${String(view.m + 1).padStart(2, '0')}`)}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={12} accessibilityLabel="Next month">
          <MaterialCommunityIcons name="chevron-right" size={26} color={t.muted} />
        </Pressable>
      </View>
      <View>
        <View style={styles.week}>
          {weekdays.map((w, i) => (
            <Text key={i} style={[styles.weekday, { color: t.muted }]}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.days}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={styles.day} />;
            const iso = toISODate(new Date(view.y, view.m, d));
            const selected = iso === value;
            return (
              <Pressable key={i} onPress={() => pick(iso)} style={styles.day} accessibilityRole="button" accessibilityState={{ selected }}>
                <View style={[styles.dayInner, selected && { backgroundColor: t.primary }, !selected && iso === today && { borderWidth: 1, borderColor: t.primary }]}>
                  <Text style={[styles.dayText, { color: selected ? '#FFFFFF' : t.text }]}>{d}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- month

interface MonthSheetProps {
  visible: boolean;
  value: MonthKey;
  onChange: (m: MonthKey) => void;
  onClose: () => void;
}

export function MonthSheet({ visible, value, onChange, onClose }: MonthSheetProps) {
  const t = useTheme();
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose month">
      <View style={styles.navRow}>
        <Pressable onPress={() => setYear(year - 1)} hitSlop={12} accessibilityLabel="Previous year">
          <MaterialCommunityIcons name="chevron-left" size={26} color={t.muted} />
        </Pressable>
        <Text style={[styles.navLabel, { color: t.text }]}>{year}</Text>
        <Pressable onPress={() => setYear(year + 1)} hitSlop={12} accessibilityLabel="Next year">
          <MaterialCommunityIcons name="chevron-right" size={26} color={t.muted} />
        </Pressable>
      </View>
      <View style={styles.months}>
        {Array.from({ length: 12 }, (_, m) => {
          const key = `${year}-${String(m + 1).padStart(2, '0')}`;
          const active = key === value;
          return (
            <Pressable
              key={key}
              onPress={() => {
                onChange(key);
                onClose();
              }}
              style={[styles.month, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.card }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.monthText, { color: active ? '#FFFFFF' : t.text }]}>{monthName(m)}</Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- simple option list

export interface SheetOption {
  label: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  destructive?: boolean;
  selected?: boolean;
  onPress: () => void;
}

export function OptionsSheet({ visible, title, options, onClose }: { visible: boolean; title?: string; options: SheetOption[]; onClose: () => void }) {
  const t = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={{ maxHeight: 440 }}>
        {options.map((o) => {
          const color = o.destructive ? t.expense : o.selected ? t.primary : t.title;
          return (
            <Pressable
              key={o.label}
              onPress={() => {
                onClose();
                o.onPress();
              }}
              style={styles.option}
              accessibilityRole="button"
              accessibilityState={{ selected: o.selected }}
            >
              {o.icon ? <MaterialCommunityIcons name={o.icon} size={22} color={o.destructive ? t.expense : t.muted} /> : null}
              <Text style={[styles.optionText, { color, fontFamily: o.selected ? font.semibold : font.medium }]}>{o.label}</Text>
              {o.selected ? <MaterialCommunityIcons name="check" size={20} color={t.primary} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}


const styles = StyleSheet.create({
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20 },
  catCell: { width: '25%', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  catCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 12, textAlign: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navLabel: { fontFamily: font.semibold, fontSize: 16, textTransform: 'capitalize' },
  week: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: font.medium, fontSize: 12, textTransform: 'uppercase', paddingBottom: 8 },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: font.medium, fontSize: 14 },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  month: { width: '31%', flexGrow: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontFamily: font.medium, fontSize: 14, textTransform: 'capitalize' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 56 },
  optionText: { flex: 1, fontSize: 16 },
});
