import type { Transaction, TransactionType } from '../types';

/** 'YYYY-MM' */
export type MonthKey = string;

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthKeyOf(date: Date | string): MonthKey {
  return (typeof date === 'string' ? date : toISODate(date)).slice(0, 7);
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function inMonth(txs: Transaction[], key: MonthKey): Transaction[] {
  return txs.filter((t) => t.date.startsWith(key));
}

export function inYear(txs: Transaction[], year: number): Transaction[] {
  return txs.filter((t) => t.date.startsWith(`${year}-`));
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
}

// Sum in cents to avoid floating-point drift (0.1 + 0.2).
const cents = (n: number) => Math.round(n * 100);

export function summarize(txs: Transaction[]): Summary {
  let income = 0;
  let expenses = 0;
  for (const t of txs) {
    if (t.type === 'income') income += cents(t.amount);
    else expenses += cents(t.amount);
  }
  return { income: income / 100, expenses: expenses / 100, balance: (income - expenses) / 100 };
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
  share: number; // 0..1 of the total for that type
  count: number;
}

export function expensesByCategory(txs: Transaction[]): CategoryTotal[] {
  return totalsByCategory(txs, 'expense');
}

export function totalsByCategory(txs: Transaction[], type: TransactionType): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  let all = 0;
  for (const t of txs) {
    if (t.type !== type) continue;
    const e = map.get(t.categoryId) ?? { total: 0, count: 0 };
    e.total += cents(t.amount);
    e.count += 1;
    map.set(t.categoryId, e);
    all += cents(t.amount);
  }
  return [...map.entries()]
    .map(([categoryId, e]) => ({ categoryId, total: e.total / 100, count: e.count, share: all ? e.total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

export interface DayGroup {
  date: string;
  data: Transaction[];
}

/** Newest day first; within a day, newest created first. */
export function groupByDay(txs: Transaction[]): DayGroup[] {
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const groups: DayGroup[] = [];
  for (const t of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.data.push(t);
    else groups.push({ date: t.date, data: [t] });
  }
  return groups;
}

export type Granularity = 'day' | 'week' | 'month' | 'year';

export interface Bucket {
  /** Inclusive ISO start date. */
  start: string;
  /** Exclusive ISO end date. */
  end: string;
}

const COUNTS: Record<Granularity, number> = { day: 30, week: 12, month: 12, year: 5 };

/** Consecutive periods ending with the one containing `today`, oldest first. Weeks start on Monday. */
export function periodBuckets(g: Granularity, today: Date): Bucket[] {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const n = COUNTS[g];
  const out: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let start: Date;
    let end: Date;
    if (g === 'day') {
      start = new Date(y, m, d - i);
      end = new Date(y, m, d - i + 1);
    } else if (g === 'week') {
      const monday = d - ((today.getDay() + 6) % 7);
      start = new Date(y, m, monday - i * 7);
      end = new Date(y, m, monday - i * 7 + 7);
    } else if (g === 'month') {
      start = new Date(y, m - i, 1);
      end = new Date(y, m - i + 1, 1);
    } else {
      start = new Date(y - i, 0, 1);
      end = new Date(y - i + 1, 0, 1);
    }
    out.push({ start: toISODate(start), end: toISODate(end) });
  }
  return out;
}

export function inRange(txs: Transaction[], b: Bucket): Transaction[] {
  return txs.filter((t) => t.date >= b.start && t.date < b.end);
}

/** Total of one type in each bucket. */
export function bucketTotals(txs: Transaction[], buckets: Bucket[], type: TransactionType): number[] {
  const out = new Array<number>(buckets.length).fill(0);
  for (const t of txs) {
    if (t.type !== type) continue;
    const i = buckets.findIndex((b) => t.date >= b.start && t.date < b.end);
    if (i >= 0) out[i] += cents(t.amount);
  }
  return out.map((c) => c / 100);
}

/** Expense categories used most often, most frequent first. */
export function frequentCategories(txs: Transaction[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const t of txs) if (t.type === 'expense') counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}
