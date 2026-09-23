import { useColorScheme } from 'react-native';

// Palette from the Figma file "Income & Expense Tracker App (Community)".
const light = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  text: '#222222',
  title: '#000000',
  muted: '#666666',
  border: '#DDDDDD',
  primary: '#438883',
  income: '#25A969',
  expense: '#F95B51',
  inputBg: '#FFFFFF',
  /** Icon tile behind transaction icons. */
  tile: '#F0F6F5',
  /** Background of list rows on the statistics screen. */
  row: '#FBFBFB',
  tabBar: '#FFFFFF',
  tabInactive: '#AAAAAA',
};

const dark: typeof light = {
  bg: '#0B0F17',
  card: '#151B26',
  text: '#F3F4F6',
  title: '#FFFFFF',
  muted: '#9CA3AF',
  border: '#263041',
  primary: '#5BA39E',
  income: '#4ADE80',
  expense: '#F87171',
  inputBg: '#0F141D',
  tile: '#1B2A2C',
  row: '#131923',
  tabBar: '#151B26',
  tabInactive: '#6B7280',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Brand colors that don't change with the color scheme (teal header, balance card). */
export const brand = {
  primary: '#438883',
  card: '#2F7E79',
  cardShadow: '#1B5C58',
  cardLabel: '#D0E5E4',
  highlight: '#29756F',
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
