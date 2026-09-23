import { describe, expect, it } from '@jest/globals';
import type { Transaction } from '../types';
import { dailyTotals, expensesByCategory, groupByDay, inMonth, monthlyTotals, shiftMonth, summarize, totalsByCategory } from './stats';
import { formatMoney, parseAmount } from './money';

let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: String(++n),
  type: 'expense',
  amount: 1,
  categoryId: 'other',
  date: '2026-09-01',
  source: 'manual',
  createdAt: `2026-09-01T00:00:0${n % 10}Z`,
  ...p,
});

describe('summarize', () => {
  it('computes income, expenses and balance without float drift', () => {
    const s = summarize([
      tx({ type: 'income', amount: 0.1 }),
      tx({ type: 'income', amount: 0.2 }),
      tx({ amount: 0.05 }),
    ]);
    expect(s).toEqual({ income: 0.3, expenses: 0.05, balance: 0.25 });
  });
});

describe('expensesByCategory', () => {
  it('sorts by total and ignores income', () => {
    const r = expensesByCategory([
      tx({ categoryId: 'gasoline', amount: 30 }),
      tx({ categoryId: 'car', amount: 10 }),
      tx({ categoryId: 'gasoline', amount: 10 }),
      tx({ type: 'income', categoryId: 'salary', amount: 999 }),
    ]);
    expect(r.map((c) => c.categoryId)).toEqual(['gasoline', 'car']);
    expect(r[0]).toMatchObject({ total: 40, count: 2, share: 0.8 });
  });
});

describe('months', () => {
  it('shifts across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('filters by month', () => {
    expect(inMonth([tx({ date: '2026-08-31' }), tx({ date: '2026-09-01' })], '2026-09')).toHaveLength(1);
  });
});

describe('groupByDay', () => {
  it('groups newest day first', () => {
    const g = groupByDay([tx({ date: '2026-09-01' }), tx({ date: '2026-09-03' }), tx({ date: '2026-09-01' })]);
    expect(g.map((d) => [d.date, d.data.length])).toEqual([
      ['2026-09-03', 1],
      ['2026-09-01', 2],
    ]);
  });
});

describe('parseAmount', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['12,50', 12.5],
    ['1,234.56', 1234.56],
    ['abc', NaN],
    ['', NaN],
  ])('%s -> %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });
});

describe('formatMoney', () => {
  it('shows pesos with the short $ symbol, not MX$', () => {
    const s = formatMoney(1234.5, 'MXN');
    expect(s).toContain('1,234.50');
    expect(s).toContain('$');
    expect(s).not.toContain('MX');
  });
});

describe('totalsByCategory', () => {
  it('only counts the requested type', () => {
    const r = totalsByCategory(
      [tx({ type: 'income', categoryId: 'salary', amount: 100 }), tx({ categoryId: 'car', amount: 5 })],
      'income',
    );
    expect(r).toEqual([{ categoryId: 'salary', total: 100, count: 1, share: 1 }]);
  });
});

describe('dailyTotals / monthlyTotals', () => {
  const txs = [
    tx({ date: '2026-02-01', amount: 0.1 }),
    tx({ date: '2026-02-01', amount: 0.2 }),
    tx({ date: '2026-02-28', amount: 3 }),
    tx({ date: '2026-02-28', amount: 50, type: 'income' }),
    tx({ date: '2026-03-01', amount: 7 }),
  ];

  it('buckets by day of the month', () => {
    const days = dailyTotals(txs, '2026-02', 'expense');
    expect(days).toHaveLength(28);
    expect(days[0]).toBe(0.3);
    expect(days[27]).toBe(3);
  });

  it('buckets by month of the year', () => {
    const months = monthlyTotals(txs, 2026, 'expense');
    expect(months).toHaveLength(12);
    expect(months.slice(0, 3)).toEqual([0, 3.3, 7]);
  });
});
