import { describe, expect, it } from '@jest/globals';
import type { Transaction } from '../types';
import {
  bucketTotals,
  expensesByCategory,
  frequentCategories,
  groupByDay,
  inMonth,
  periodBuckets,
  shiftMonth,
  summarize,
  totalsByCategory,
} from './stats';
import { formatMoney, money, parseAmount, signedMoney } from './money';

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


describe('periodBuckets / bucketTotals', () => {
  const today = new Date(2026, 8, 23); // Wed 23 Sep 2026

  it('builds consecutive periods ending with the current one', () => {
    expect(periodBuckets('day', today).at(-1)).toEqual({ start: '2026-09-23', end: '2026-09-24' });
    expect(periodBuckets('week', today).at(-1)).toEqual({ start: '2026-09-21', end: '2026-09-28' });
    const months = periodBuckets('month', today);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ start: '2025-10-01', end: '2025-11-01' });
    expect(periodBuckets('year', today)[0]).toEqual({ start: '2022-01-01', end: '2023-01-01' });
  });

  it('sums each bucket for one type', () => {
    const buckets = periodBuckets('month', today);
    const totals = bucketTotals(
      [tx({ date: '2026-09-01', amount: 2 }), tx({ date: '2026-08-31', amount: 1 }), tx({ date: '2026-09-02', type: 'income', amount: 9 })],
      buckets,
      'expense',
    );
    expect(totals.slice(-2)).toEqual([1, 2]);
  });
});

describe('frequentCategories', () => {
  it('orders expense categories by use', () => {
    const txs = [tx({ categoryId: 'car' }), tx({ categoryId: 'gasoline' }), tx({ categoryId: 'gasoline' }), tx({ type: 'income', categoryId: 'salary' })];
    expect(frequentCategories(txs, 5)).toEqual(['gasoline', 'car']);
  });
});

describe('money', () => {
  it('puts a space after a leading symbol', () => {
    expect(money(1240.5, 'USD')).toMatch(/^\$ 1,240\.50$|1\.?240,50/);
    expect(signedMoney({ type: 'expense', amount: 5 }, 'USD')).toMatch(/^- /);
  });
});
