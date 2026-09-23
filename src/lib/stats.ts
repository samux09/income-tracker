import type { Transaction } from '../types';

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
  share: number; // 0..1 of all expenses
  count: number;
}

export function expensesByCategory(txs: Transaction[]): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  let all = 0;
  for (const t of txs) {
    if (t.type !== 'expense') continue;
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
