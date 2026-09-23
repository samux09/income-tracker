import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, SvgXml } from 'react-native-svg';
import { chartDot, tooltip } from '../assets/figma';
import { font, useTheme } from '../theme';

interface Props {
  values: number[];
  labels: string[];
  selected: number;
  onSelect: (index: number) => void;
  formatValue: (v: number) => string;
}

const TOP = 62; // room for the tooltip above the highest point
const PLOT = 140;
const INSET = 20;
const LABEL_GAP = 15;
const MIN_LABEL_SPACING = 36;

/** Smooth path through points (Catmull-Rom converted to cubic Béziers), clamped to the plot area. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  const clamp = (y: number) => Math.min(TOP + PLOT, Math.max(TOP, y));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clamp(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clamp(p2.y - (p3.y - p1.y) / 6) };
    d += `C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({ values, labels, selected, onSelect, formatValue }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const max = Math.max(...values, 0) || 1;
  const step = values.length > 1 ? (width - INSET * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => ({ x: INSET + i * step, y: TOP + PLOT - (v / max) * PLOT }));
  const line = smoothPath(pts);
  const bottom = TOP + PLOT;
  const area = pts.length ? `${line}L${pts[pts.length - 1].x} ${bottom}L${pts[0].x} ${bottom}Z` : '';

  const sel = pts[selected];
  const tipText = formatValue(values[selected] ?? 0);
  const tipWidth = Math.max(80, tipText.length * 8.5 + 16);
  const tipLeft = sel ? Math.min(width - tipWidth - 4, Math.max(4, sel.x - tipWidth / 2)) : 0;

  const labelEvery = Math.max(1, Math.ceil(MIN_LABEL_SPACING / (step || 1)));
  const showLabel = (i: number) =>
    i === selected || (i % labelEvery === 0 && Math.abs(i - selected) * step >= MIN_LABEL_SPACING);

  const onPress = (x: number) => {
    if (!step) return onSelect(0);
    onSelect(Math.min(values.length - 1, Math.max(0, Math.round((x - INSET) / step))));
  };

  return (
    <Pressable onPress={(e) => onPress(e.nativeEvent.locationX)} accessibilityLabel="Chart">
      <Svg width={width} height={bottom + 4}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.primary} stopOpacity={0.3} />
            <Stop offset="1" stopColor={t.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#area)" />
        <Path d={line} stroke={t.primary} strokeWidth={2} strokeLinecap="round" fill="none" />
        {sel ? <Line x1={sel.x} y1={sel.y} x2={sel.x} y2={bottom} stroke={t.muted} strokeWidth={1} strokeDasharray="4 4" /> : null}
      </Svg>

      {sel ? (
        <>
          <SvgXml xml={chartDot} width={28} height={28} style={[styles.abs, { left: sel.x - 14, top: sel.y - 14 }]} />
          <View style={[styles.abs, { left: tipLeft, top: sel.y - 22 - 48, width: tipWidth, height: 48 }]}>
            <SvgXml xml={tooltip} width={tipWidth} height={48} preserveAspectRatio="none" style={StyleSheet.absoluteFill} />
            <Text style={[styles.tip, { color: t.primary }]} numberOfLines={1}>
              {tipText}
            </Text>
          </View>
        </>
      ) : null}

      <View style={{ height: 17 + LABEL_GAP }}>
        {labels.map((label, i) =>
          showLabel(i) ? (
            <Text
              key={i}
              style={[
                styles.label,
                { left: pts[i].x - 20, top: LABEL_GAP - 4 },
                i === selected ? { color: t.primary, fontFamily: font.semibold } : { color: t.muted },
              ]}
            >
              {label}
            </Text>
          ) : null,
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  tip: { marginTop: 11, textAlign: 'center', fontFamily: font.semibold, fontSize: 14 },
  label: { position: 'absolute', width: 40, textAlign: 'center', fontFamily: font.regular, fontSize: 14, letterSpacing: -0.28 },
});
