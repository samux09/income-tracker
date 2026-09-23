import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import {
  chartActive,
  chartInactive,
  fabPlus,
  homeActive,
  homeInactive,
  userActive,
  userInactive,
  walletActive,
  walletInactive,
} from '../assets/figma';
import { brand, useTheme } from '../theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 80;
const FAB_SIZE = 75;
const DESIGN_WIDTH = 414;

// Per route: [active icon, inactive icon, accessibility label, icon center x on the 414px design].
const TABS: Record<string, [string, string, string, number]> = {
  index: [homeActive, homeInactive, 'Home', 50],
  stats: [chartActive, chartInactive, 'Statistics', 121],
  wallet: [walletActive, walletInactive, 'Wallet', 292],
  settings: [userActive, userInactive, 'Profile', 364],
};

/** Notch geometry from the Figma tab bar: 89.8px wide, 42px deep, centered. */
function notchPath(width: number, height: number) {
  const c = width / 2;
  return (
    `M0 0H${c - 44.902}` +
    `C${c - 43.358} 23.454 ${c - 23.845} 42 ${c} 42` +
    `C${c + 23.845} 42 ${c + 43.358} 23.454 ${c + 44.902} 0` +
    `H${width}V${height}H0Z`
  );
}

export function TabBar({ state, navigation, insets }: TabBarProps) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const height = BAR_HEIGHT + insets.bottom;
  // Keep side icons at their design positions, measured from the nearest edge.
  const xFor = (designX: number) => (designX < DESIGN_WIDTH / 2 ? designX : width - (DESIGN_WIDTH - designX));

  return (
    <View style={[styles.bar, { height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={notchPath(width, height)} fill={t.tabBar} />
      </Svg>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const [active, inactive, label, designX] = tab;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.item, { left: xFor(designX) - 24 }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
          >
            <SvgXml xml={focused ? active : inactive} width={34.75} height={36} />
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => router.push({ pathname: '/transaction', params: { type: 'expense' } })}
        style={({ pressed }) => [styles.fab, { left: width / 2 - FAB_SIZE / 2, opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <SvgXml xml={fabPlus} width={24} height={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, boxShadow: '0px -2px 25px rgba(0, 0, 0, 0.06)' },
  item: { position: 'absolute', top: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    top: -3 - FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 15px 40px rgba(31, 97, 92, 0.55)',
  },
});
