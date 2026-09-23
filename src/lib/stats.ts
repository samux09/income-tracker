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

/** Totals of one type for each day of the month (index 0 = day 1). */
export function dailyTotals(txs: Transaction[], key: MonthKey, type: TransactionType): number[] {
  const [y, m] = key.split('-').map(Number);
  const out = new Array<number>(new Date(y, m, 0).getDate()).fill(0);
  for (const t of txs) {
    if (t.type === type && t.date.startsWith(key)) out[Number(t.date.slice(8, 10)) - 1] += cents(t.amount);
  }
  return out.map((c) => c / 100);
}

/** Totals of one type for each month of the year (index 0 = January). */
export function monthlyTotals(txs: Transaction[], year: number, type: TransactionType): number[] {
  const out = new Array<number>(12).fill(0);
  for (const t of txs) {
    if (t.type === type && t.date.startsWith(`${year}-`)) out[Number(t.date.slice(5, 7)) - 1] += cents(t.amount);
  }
  return out.map((c) => c / 100);
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
