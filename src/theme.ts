import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#2563EB',
  income: '#16A34A',
  expense: '#DC2626',
  inputBg: '#F9FAFB',
};

const dark: typeof light = {
  bg: '#0B0F17',
  card: '#151B26',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#263041',
  primary: '#60A5FA',
  income: '#4ADE80',
  expense: '#F87171',
  inputBg: '#0F141D',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
