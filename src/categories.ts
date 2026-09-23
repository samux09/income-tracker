// Categories — see specs/001-income-tracker/spec.md §5
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TransactionType } from './types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Category {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  type: TransactionType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'car', label: 'Car', icon: 'car', color: '#3B82F6', type: 'expense' },
  { id: 'gasoline', label: 'Gasoline', icon: 'gas-station', color: '#F97316', type: 'expense' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'pill', color: '#10B981', type: 'expense' },
  { id: 'doctors', label: 'Doctors', icon: 'stethoscope', color: '#EF4444', type: 'expense' },
  { id: 'supermarket', label: 'Supermarket', icon: 'cart', color: '#84CC16', type: 'expense' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'repeat', color: '#8B5CF6', type: 'expense' },
  { id: 'restaurants', label: 'Restaurants', icon: 'silverware-fork-knife', color: '#EC4899', type: 'expense' },
  { id: 'home', label: 'Home & Utilities', icon: 'home-lightning-bolt', color: '#0EA5E9', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie-open', color: '#F59E0B', type: 'expense' },
  { id: 'education', label: 'Education', icon: 'school', color: '#6366F1', type: 'expense' },
  { id: 'clothing', label: 'Clothing', icon: 'tshirt-crew', color: '#14B8A6', type: 'expense' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal-circle', color: '#6B7280', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'Salary', icon: 'briefcase', color: '#16A34A', type: 'income' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop', color: '#0D9488', type: 'income' },
  { id: 'transfer', label: 'Transfer received', icon: 'bank-transfer-in', color: '#2563EB', type: 'income' },
  { id: 'refund', label: 'Refund', icon: 'cash-refund', color: '#9333EA', type: 'income' },
  { id: 'other-income', label: 'Other income', icon: 'cash-plus', color: '#65A30D', type: 'income' },
];

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const FALLBACK: Category = { id: 'unknown', label: 'Unknown', icon: 'help-circle', color: '#9CA3AF', type: 'expense' };

export function categoriesFor(type: TransactionType): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function getCategory(id: string): Category {
  return ALL.find((c) => c.id === id) ?? FALLBACK;
}
