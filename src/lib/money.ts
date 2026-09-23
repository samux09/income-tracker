import type { Transaction } from '../types';

export const CURRENCIES = ['MXN', 'USD', 'EUR', 'COP', 'PEN', 'ARS', 'CLP', 'GTQ', 'DOP', 'CAD', 'GBP', 'BRL'];

/** `whole` drops the cents, for compact labels like chart tooltips. */
export function formatMoney(amount: number, currency: string, whole = false): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(amount);
  } catch {
    // Unknown currency code or missing Intl support.
    return `${currency} ${amount.toFixed(whole ? 0 : 2)}`;
  }
}

/** Like formatMoney, with the space after a leading symbol that the design uses ("$ 1,240.50"). */
export function money(amount: number, currency: string, whole = false): string {
  return formatMoney(amount, currency, whole).replace(/^(\D+?)(\d)/, (_, sym: string, d: string) => `${sym.trim()} ${d}`);
}

export function signedMoney(tx: Pick<Transaction, 'type' | 'amount'>, currency: string): string {
  return `${tx.type === 'income' ? '+' : '-'} ${money(tx.amount, currency)}`;
}

/** Parses user input like "1,234.50" or "12,5" into a number, or NaN. */
export function parseAmount(input: string): number {
  const s = input.trim().replace(/\s/g, '');
  if (!s) return NaN;
  // If the only separator is a comma followed by 1-2 digits, treat it as decimal.
  const normalized = /^\d+,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  if (!/^\d*\.?\d+$/.test(normalized)) return NaN;
  return Math.round(Number(normalized) * 100) / 100;
}

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
