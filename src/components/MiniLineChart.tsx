import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { formatPrice, formatShortDate } from "../lib/format";
import type { ChartPoint } from "../types/api";

interface MiniLineChartProps {
  points: ChartPoint[];
  height?: number;
  strokeColor?: string;
  highlightDate?: string;
  showAxisLabels?: boolean;
  /** Lets the caller make data points tappable (e.g. the full Chart screen). */
  onPointPress?: (point: ChartPoint) => void;
}

const PADDING_TOP = 34;
const PADDING_BOTTOM = 8;
const PADDING_HORIZONTAL = 10;
const TOOLTIP_WIDTH = 96;

export function MiniLineChart({ points, height = 160, strokeColor = "#175CD3", highlightDate, showAxisLabels = true, onPointPress }: MiniLineChartProps) {
  const [width, setWidth] = useState(0);

  const chart = useMemo(() => {
    if (width === 0 || points.length === 0) {
      return null;
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const plotWidth = Math.max(width - PADDING_HORIZONTAL * 2, 1);
    const plotHeight = Math.max(height - PADDING_TOP - PADDING_BOTTOM, 1);

    const xAt = (index: number) => PADDING_HORIZONTAL + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const yAt = (value: number) => PADDING_TOP + (1 - (value - min) / range) * plotHeight;

    const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(point.value).toFixed(1)}`).join(" ");
    const positions = points.map((point, index) => ({ point, x: xAt(index), y: yAt(point.value) }));

    const highlightIndex = highlightDate ? points.findIndex((p) => p.date === highlightDate) : points.length - 1;
    const resolvedHighlightIndex = highlightIndex >= 0 ? highlightIndex : points.length - 1;
    const highlightPoint = points[resolvedHighlightIndex];
    const highlightX = xAt(resolvedHighlightIndex);
    const highlightY = yAt(highlightPoint.value);

    const tooltipLeft = Math.min(Math.max(highlightX - TOOLTIP_WIDTH / 2, 0), Math.max(width - TOOLTIP_WIDTH, 0));

    return { path, positions, highlightX, highlightY, highlightPoint, tooltipLeft };
  }, [width, height, points, highlightDate]);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      {chart ? (
        <>
          <View style={[styles.tooltip, { left: chart.tooltipLeft, top: Math.max(chart.highlightY - 34, 0) }]}>
            <Text style={styles.tooltipText}>{formatShortDate(chart.highlightPoint.date)}</Text>
            <Text style={styles.tooltipValue}>{formatPrice(chart.highlightPoint.value)}</Text>
          </View>
          <Svg width={width} height={height}>
            <Path d={chart.path} stroke={strokeColor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={chart.highlightX} cy={chart.highlightY} r={5} fill={strokeColor} stroke="#FFFFFF" strokeWidth={2} />
          </Svg>
          {onPointPress
            ? chart.positions.map(({ point, x, y }) => (
                <Pressable
                  key={point.date}
                  onPress={() => onPointPress(point)}
                  hitSlop={8}
                  style={[styles.touchTarget, { left: x - 12, top: y - 12 }]}
                />
              ))
            : null}
          {showAxisLabels ? (
            <View style={styles.axisRow}>
              <Text style={styles.axisLabel}>{formatShortDate(points[0].date)}</Text>
              {points.length > 2 ? <Text style={styles.axisLabel}>{formatShortDate(points[Math.floor(points.length / 2)].date)}</Text> : null}
              <Text style={styles.axisLabel}>{formatShortDate(points[points.length - 1].date)}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: PADDING_HORIZONTAL
  },
  axisLabel: {
    color: "#98A2B3",
    fontSize: 11
  },
  tooltip: {
    position: "absolute",
    zIndex: 2,
    width: TOOLTIP_WIDTH,
    backgroundColor: "#101828",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center"
  },
  tooltipText: {
    color: "#F2F4F7",
    fontSize: 10
  },
  tooltipValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  touchTarget: {
    position: "absolute",
    width: 24,
    height: 24,
    zIndex: 3
  }
});
