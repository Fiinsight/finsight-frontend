import { Fragment, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";
import { formatPrice, formatShortDate, formatShortDateTime, formatShortTime } from "../lib/format";
import type { ChartCandle } from "../types/api";

interface MoveMarker {
  color?: string;
  title?: string;
  date: string;
  changePercent: number;
}

interface CandlestickChartProps {
  candles: ChartCandle[];
  selectedDate?: string;
  height?: number;
  upColor?: string;
  downColor?: string;
  onCandlePress?: (candle: ChartCandle) => void;
  showTimeLabels?: boolean;
  /** Small, non-blocking markers for the largest backend-detected moves. */
  moveMarkers?: MoveMarker[];
}

const PADDING_TOP = 58;
const PADDING_BOTTOM = 20;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 52; // room for gridline price labels
const TOOLTIP_WIDTH = 130;
const MIN_BODY_HEIGHT = 1.5;
const GRIDLINE_COUNT = 4;
const MAX_DATE_LABELS = 6;

export function CandlestickChart({
  candles,
  selectedDate,
  height = 240,
  upColor = "#D92D20",
  downColor = "#175CD3",
  onCandlePress,
  showTimeLabels = false,
  moveMarkers = []
}: CandlestickChartProps) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => setSelectedIndex(null), [candles, selectedDate]);

  const chart = useMemo(() => {
    if (width === 0 || candles.length === 0) {
      return null;
    }

    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = max - min || 1;
    const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 1);
    const plotHeight = Math.max(height - PADDING_TOP - PADDING_BOTTOM, 1);

    const slot = plotWidth / candles.length;
    const bodyWidth = Math.max(Math.min(slot * 0.6, 22), 3);

    const yAt = (value: number) => PADDING_TOP + (1 - (value - min) / range) * plotHeight;
    const xAt = (index: number) => PADDING_LEFT + slot * index + slot / 2;

    const bars = candles.map((candle, index) => {
      const isUp = candle.close >= candle.open;
      const x = xAt(index);
      const bodyTop = yAt(Math.max(candle.open, candle.close));
      const bodyBottom = yAt(Math.min(candle.open, candle.close));
      const prevClose = index > 0 ? candles[index - 1].close : candle.open;
      const changePercent = prevClose !== 0 ? ((candle.close - prevClose) / prevClose) * 100 : 0;
      return {
        candle,
        index,
        x,
        wickTop: yAt(candle.high),
        wickBottom: yAt(candle.low),
        bodyY: bodyTop,
        bodyHeight: Math.max(bodyBottom - bodyTop, MIN_BODY_HEIGHT),
        color: isUp ? upColor : downColor,
        changePercent
      };
    });

    // 가로선: 최고/최저 사이를 균등하게 나눠 가격 눈금선을 그림 (증권 앱에서 흔히 보는 그리드)
    const gridlines = Array.from({ length: GRIDLINE_COUNT + 1 }, (_, i) => {
      const value = min + (range * i) / GRIDLINE_COUNT;
      return { value, y: yAt(value) };
    });

    // 날짜 라벨: 후보 개수만큼 균등 간격으로 뽑되, 캔들 수가 적으면 전부 표시
    const labelCount = Math.min(MAX_DATE_LABELS, candles.length);
    const labelIndices = Array.from({ length: labelCount }, (_, i) =>
      labelCount === 1 ? 0 : Math.round((i * (candles.length - 1)) / (labelCount - 1))
    );

    const moveMarkerByDate = new Map(moveMarkers.map((marker) => [marker.date, marker]));
    const visibleMoveMarkers = bars
      .map((bar) => ({ bar, marker: moveMarkerByDate.get(bar.candle.date) }))
      .filter((item): item is { bar: (typeof bars)[number]; marker: MoveMarker } => Boolean(item.marker));
    // Labels have their own top lane; leader lines keep each label tied to its candle.
    const markers = visibleMoveMarkers.map((item, index) => ({ ...item,
      labelX: PADDING_LEFT + plotWidth * (index + 0.5) / visibleMoveMarkers.length
    }));

    const resolvedIndex = selectedIndex !== null && selectedIndex < candles.length ? selectedIndex : candles.length - 1;
    const activeBar = bars[resolvedIndex];
    const tooltipLeft = Math.min(Math.max(activeBar.x - TOOLTIP_WIDTH / 2, 0), Math.max(width - TOOLTIP_WIDTH, 0));

    return {
      bars,
      bodyWidth,
      slot,
      activeBar,
      tooltipLeft,
      gridlines,
      labelIndices,
      markers,
      visibleMoveMarkers
    };
  }, [width, height, candles, selectedIndex, upColor, downColor, moveMarkers, selectedDate]);

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {chart ? (
        <>
          {selectedIndex !== null ? <View style={[styles.tooltip, { left: chart.tooltipLeft }]}>
            <Text style={styles.tooltipDate}>{showTimeLabels ? formatShortDateTime(chart.activeBar.candle.date) : formatShortDate(chart.activeBar.candle.date)}</Text>
            <Text style={styles.tooltipValue}>
              종가 <Text style={styles.tooltipStrong}>{formatPrice(chart.activeBar.candle.close)}</Text>
            </Text>
            <Text style={styles.tooltipRange}>
              고 {formatPrice(chart.activeBar.candle.high)} · 저 {formatPrice(chart.activeBar.candle.low)}
            </Text>
          </View> : null}
          <Svg width={width} height={height}>
            {chart.bars.filter(bar => bar.candle.date === selectedDate).map(bar => <Rect key={`selected-${bar.index}`} x={Math.max(PADDING_LEFT, bar.x - Math.max(chart.slot, 12) / 2)} y={PADDING_TOP} width={Math.max(chart.slot, 12)} height={height - PADDING_TOP - PADDING_BOTTOM} fill="#EFF8FF" />)}
            {chart.gridlines.map((line, i) => (
              <Line
                key={`grid-${i}`}
                x1={PADDING_LEFT}
                x2={width - PADDING_RIGHT}
                y1={line.y}
                y2={line.y}
                stroke="#EAECF0"
                strokeWidth={1}
                strokeDasharray={i === 0 || i === GRIDLINE_COUNT ? undefined : "3,4"}
              />
            ))}
            {chart.gridlines.map((line, i) => (
              <SvgText key={`grid-label-${i}`} x={width - PADDING_RIGHT + 6} y={line.y + 3} fontSize={10} fill="#98A2B3">
                {formatPrice(Math.round(line.value))}
              </SvgText>
            ))}
            {chart.bars.map((bar) => (
              <Line
                key={`wick-${bar.index}`}
                x1={bar.x}
                x2={bar.x}
                y1={bar.wickTop}
                y2={bar.wickBottom}
                stroke={bar.color}
                strokeWidth={1.5}
              />
            ))}
            {chart.markers.map(({ bar, marker, labelX }) => {
              const isUp = marker.changePercent > 0;
              const y = isUp ? bar.wickTop - 7 : bar.wickBottom + 7;
              const color = marker.color ?? (isUp ? upColor : downColor);
              const points = isUp ? `${bar.x},${y - 5} ${bar.x - 4},${y + 2} ${bar.x + 4},${y + 2}` : `${bar.x},${y + 5} ${bar.x - 4},${y - 2} ${bar.x + 4},${y - 2}`;
              return <Fragment key={`marker-${bar.index}`}>
                <Line key={`leader-${bar.index}`} x1={labelX} y1={40} x2={bar.x} y2={y} stroke="#D0D5DD" strokeWidth={1} strokeDasharray="2,3" />
                {bar.candle.date === selectedDate ? <Circle key={`ring-${bar.index}`} cx={bar.x} cy={y} r={9} fill="none" stroke={color} strokeWidth={2} /> : null}
                <Polygon key={`move-marker-${bar.index}`} points={points} fill={color} />
              </Fragment>;
            })}
            {chart.bars.map((bar) => (
              <Rect
                key={`body-${bar.index}`}
                x={bar.x - chart.bodyWidth / 2}
                y={bar.bodyY}
                width={chart.bodyWidth}
                height={bar.bodyHeight}
                fill={bar.color}
                rx={1}
              />
            ))}
          </Svg>
          {chart.bars.map((bar) => (
            <Pressable
              key={`touch-${bar.index}`}
              hitSlop={4}
              onPress={() => {
                setSelectedIndex(moveMarkers.some(marker => marker.date === bar.candle.date) ? null : bar.index);
                onCandlePress?.(bar.candle);
              }}
              accessibilityRole="button" accessibilityLabel={`${bar.candle.date} 종가 ${formatPrice(bar.candle.close)}`}
              style={[styles.touchTarget, { top: PADDING_TOP, height: height - PADDING_TOP, left: bar.x - chart.slot / 2, width: chart.slot }]}
            />
          ))}
          {selectedIndex === null ? chart.markers.map(({ bar, marker, labelX }) => <Pressable key={`marker-touch-${bar.index}`} accessibilityRole="button"
            accessibilityLabel={`${bar.candle.date} 급등락 ${marker.changePercent > 0 ? "+" : ""}${marker.changePercent.toFixed(2)}% 선택`}
            accessibilityState={{ selected: bar.candle.date === selectedDate }} onPress={() => { setSelectedIndex(null); onCandlePress?.(bar.candle); }}
            style={[styles.markerTarget, { left: labelX - 22, borderColor: bar.candle.date === selectedDate ? (marker.changePercent >= 0 ? upColor : downColor) : "transparent" }]}>
            <Text style={[styles.markerText, { color: marker.changePercent >= 0 ? upColor : downColor }]}>{marker.changePercent > 0 ? "+" : ""}{marker.changePercent.toFixed(2)}%</Text>
          </Pressable>) : null}
          <View style={[styles.axisRow, { paddingRight: PADDING_RIGHT }]}>
            {chart.labelIndices.map((idx) => (
              <Text key={idx} style={styles.axisLabel}>
                {showTimeLabels ? formatShortTime(candles[idx].date) : formatShortDate(candles[idx].date)}
              </Text>
            ))}
          </View>
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
    paddingLeft: PADDING_LEFT
  },
  axisLabel: {
    color: "#98A2B3",
    fontSize: 11
  },
  tooltip: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    width: TOOLTIP_WIDTH,
    backgroundColor: "#101828",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 1
  },
  tooltipDate: {
    color: "#98A2B3",
    fontSize: 10
  },
  tooltipValue: {
    color: "#F2F4F7",
    fontSize: 11
  },
  tooltipStrong: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  tooltipRange: {
    color: "#98A2B3",
    fontSize: 10
  },
  markerTarget: { position: "absolute", top: 4, width: 44, height: 36, borderWidth: 2, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  markerText: { fontSize: 10, fontWeight: "700" },
  touchTarget: {
    position: "absolute",
    top: 0,
  }
});
