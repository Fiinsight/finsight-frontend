import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { formatPrice, formatShortDate } from "../lib/format";
import type { ChartCandle } from "../types/api";

interface DateMarker {
  date: string;
  title: string;
}

interface CandlestickChartProps {
  candles: ChartCandle[];
  height?: number;
  upColor?: string;
  downColor?: string;
  onCandlePress?: (candle: ChartCandle) => void;
  /** Real news items to ground the biggest-move callout in an actual headline. */
  markers?: DateMarker[];
}

const PADDING_TOP = 40;
const PADDING_BOTTOM = 20;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 52; // room for gridline price labels
const TOOLTIP_WIDTH = 130;
const MIN_BODY_HEIGHT = 1.5;
const GRIDLINE_COUNT = 4;
const MAX_DATE_LABELS = 6;

export function CandlestickChart({
  candles,
  height = 240,
  upColor = "#D92D20",
  downColor = "#175CD3",
  onCandlePress,
  markers = []
}: CandlestickChartProps) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

    // 급등락 지점: 캔들 구간 내에서 |전일 대비 변동률|이 가장 큰 지점을 찾아 콜아웃으로 표시.
    // 실제 관련 뉴스가 같은 날짜에 있으면 그 제목을 근거로 같이 보여주고, 없으면 숫자만 보여줌
    // (근거 없는 이유를 지어내지 않음).
    let biggestMove = bars[0];
    for (const bar of bars) {
      if (Math.abs(bar.changePercent) > Math.abs(biggestMove.changePercent)) {
        biggestMove = bar;
      }
    }
    const matchingMarker = markers.find((m) => m.date === biggestMove.candle.date);
    const showCallout = Math.abs(biggestMove.changePercent) >= 1 && candles.length > 1;
    const calloutIsUp = biggestMove.changePercent >= 0;
    const calloutY = calloutIsUp ? biggestMove.wickTop - 10 : biggestMove.wickBottom + 10;
    const calloutText = `${calloutIsUp ? "+" : ""}${biggestMove.changePercent.toFixed(1)}%${matchingMarker ? ` · ${matchingMarker.title}` : ""}`;

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
      showCallout,
      biggestMove,
      calloutY,
      calloutText,
      calloutIsUp
    };
  }, [width, height, candles, selectedIndex, upColor, downColor, markers]);

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {chart ? (
        <>
          <View style={[styles.tooltip, { left: chart.tooltipLeft }]}>
            <Text style={styles.tooltipDate}>{formatShortDate(chart.activeBar.candle.date)}</Text>
            <Text style={styles.tooltipValue}>
              종가 <Text style={styles.tooltipStrong}>{formatPrice(chart.activeBar.candle.close)}</Text>
            </Text>
            <Text style={styles.tooltipRange}>
              고 {formatPrice(chart.activeBar.candle.high)} · 저 {formatPrice(chart.activeBar.candle.low)}
            </Text>
          </View>
          <Svg width={width} height={height}>
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
            {chart.showCallout ? (
              <>
                <Line
                  x1={chart.biggestMove.x}
                  x2={chart.biggestMove.x}
                  y1={chart.calloutIsUp ? chart.calloutY + 4 : chart.calloutY - 4}
                  y2={chart.calloutIsUp ? chart.biggestMove.wickTop : chart.biggestMove.wickBottom}
                  stroke="#98A2B3"
                  strokeWidth={1}
                />
                <SvgText
                  x={Math.min(Math.max(chart.biggestMove.x, 60), width - 60)}
                  y={chart.calloutY}
                  fontSize={11}
                  fontWeight="700"
                  fill={chart.biggestMove.color}
                  textAnchor="middle"
                >
                  {chart.calloutText}
                </SvgText>
              </>
            ) : null}
          </Svg>
          {chart.bars.map((bar) => (
            <Pressable
              key={`touch-${bar.index}`}
              hitSlop={4}
              onPress={() => {
                setSelectedIndex(bar.index);
                onCandlePress?.(bar.candle);
              }}
              style={[styles.touchTarget, { left: bar.x - chart.slot / 2, width: chart.slot }]}
            />
          ))}
          <View style={[styles.axisRow, { paddingRight: PADDING_RIGHT }]}>
            {chart.labelIndices.map((idx) => (
              <Text key={idx} style={styles.axisLabel}>
                {formatShortDate(candles[idx].date)}
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
  touchTarget: {
    position: "absolute",
    top: 0,
    bottom: 0
  }
});
