// Palette from the Figma file "Income & Expense Tracker App (Community)".
// The design is light-only, so app.json pins userInterfaceStyle to "light".
const light = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  text: '#222222',
  title: '#000000',
  muted: '#666666',
  border: '#DDDDDD',
  divider: '#EEEEEE',
  primary: '#438883',
  income: '#25A969',
  expense: '#F95B51',
  /** Icon tile behind transaction icons. */
  tile: '#F0F6F5',
  /** Background of list rows on the statistics screen. */
  row: '#FBFBFB',
  /** Segmented control track. */
  track: '#F4F6F6',
  tabBar: '#FFFFFF',
  tabInactive: '#AAAAAA',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return light;
}

/** Brand colors used on the teal header, balance card and badges. */
export const brand = {
  primary: '#438883',
  card: '#2F7E79',
  cardShadow: '#1B5C58',
  cardLabel: '#D0E5E4',
  highlight: '#29756F',
  buttonTop: '#69AEA9',
  buttonBottom: '#3F8782',
  expenseBadgeBg: '#FDECEA',
  expenseBadgeText: '#D8473D',
  incomeBadgeBg: '#EAF4F3',
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
