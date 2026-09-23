import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { chartActive, chartInactive, fabPlus, homeActive, homeInactive, userInactive } from '../assets/figma';
import { brand, useTheme } from '../theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 80;
const FAB_SIZE = 75;

// Icons per route: [active, inactive]. The design has no active user icon, so tint the outline.
const ICONS: Record<string, [string, string]> = {
  index: [homeActive, homeInactive],
  stats: [chartActive, chartInactive],
  settings: [userInactive.replaceAll('#AAAAAA', brand.primary), userInactive],
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

  const tab = (index: number) => {
    const route = state.routes[index];
    const focused = state.index === index;
    const [active, inactive] = ICONS[route.name] ?? ICONS.index;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.item}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={route.name === 'index' ? 'Home' : route.name === 'stats' ? 'Statistics' : 'Settings'}
      >
        <SvgXml xml={focused ? active : inactive} width={34.75} height={36} />
      </Pressable>
    );
  };

  const half = Math.ceil(state.routes.length / 2);
  const left = state.routes.slice(0, half).map((_, i) => tab(i));
  const right = state.routes.slice(half).map((_, i) => tab(half + i));

  return (
    <View style={[styles.bar, { height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={notchPath(width, height)} fill={t.tabBar} />
      </Svg>
      <View style={[styles.row, { height: BAR_HEIGHT }]}>
        <View style={styles.side}>{left}</View>
        <View style={{ width: FAB_SIZE + 24 }} />
        <View style={styles.side}>{right}</View>
      </View>
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
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    boxShadow: '0px -2px 25px rgba(0, 0, 0, 0.06)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' },
  item: { padding: 6 },
  fab: {
    position: 'absolute',
    top: -3 - FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 15px 40px rgba(31, 97, 92, 0.6)',
  },
});
