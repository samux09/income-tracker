import { useSyncExternalStore } from 'react';
import { monthKeyOf, type MonthKey } from '../lib/stats';

// Selected month shared by the Transactions and Categories tabs.
let current: MonthKey = monthKeyOf(new Date());
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function setMonth(m: MonthKey) {
  current = m;
  listeners.forEach((l) => l());
}

export function useMonth(): [MonthKey, (m: MonthKey) => void] {
  return [useSyncExternalStore(subscribe, () => current), setMonth];
}
