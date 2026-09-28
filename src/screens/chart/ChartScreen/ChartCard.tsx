import { StyleSheet, Text, View } from "react-native";
import { CandlestickChart } from "../../../components/CandlestickChart";
import type { ChartCandle, ChartRelatedNews } from "../../../types/api";

type ChartPeriod = "D" | "W" | "MINUTE";

interface ChartCardProps {
  candles: ChartCandle[];
  period: ChartPeriod;
  minuteInterval?: number;
  relatedNews?: ChartRelatedNews[];
  onCandlePress?: (candle: ChartCandle) => void;
}

export function ChartCard({ candles, period, minuteInterval, relatedNews = [], onCandlePress }: ChartCardProps) {
  const markers = relatedNews
    .filter((item) => item.publishedAt)
    .map((item) => ({ date: item.publishedAt.slice(0, 10), title: item.title }));
  const periodLabel = period === "D" ? "하루" : period === "W" ? "일주일" : `${minuteInterval ?? 5}분`;

  return (
    <View style={styles.card}>
      <CandlestickChart candles={candles} height={240} markers={markers} onCandlePress={onCandlePress} />
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>차트 색상 보는 법</Text>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, styles.upSwatch]} />
          <Text style={styles.legendText}>빨강: {periodLabel} 동안 종가가 시가보다 높거나 같음</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.swatch, styles.downSwatch]} />
          <Text style={styles.legendText}>파랑: {periodLabel} 동안 종가가 시가보다 낮음</Text>
        </View>
        <Text style={styles.guideText}>몸통은 시가·종가, 위아래 꼬리는 그 기간의 최고·최저를 보여줘요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16
  },
  guide: {
    marginTop: 12,
    gap: 6
  },
  guideTitle: {
    color: "#101828",
    fontSize: 12,
    fontWeight: "800"
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  upSwatch: {
    backgroundColor: "#D92D20"
  },
  downSwatch: {
    backgroundColor: "#175CD3"
  },
  legendText: {
    color: "#475467",
    fontSize: 12,
    lineHeight: 18
  },
  guideText: {
    color: "#98A2B3",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2
  }
});
