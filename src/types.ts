// Data model — see specs/001-income-tracker/spec.md §6

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Positive amount in major units (e.g. 12.5). */
  amount: number;
  categoryId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  note?: string;
  /** 'auto' is reserved for card auto-detection (spec 002). */
  source: 'manual' | 'auto';
  createdAt: string;
}

export interface Settings {
  currency: string;
}

export interface AppData {
  version: 1;
  transactions: Transaction[];
  settings: Settings;
}
