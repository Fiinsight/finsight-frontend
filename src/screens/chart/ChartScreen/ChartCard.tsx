import { StyleSheet, View } from "react-native";
import { CandlestickChart } from "../../../components/CandlestickChart";
import type { ChartCandle, ChartRelatedNews } from "../../../types/api";

interface ChartCardProps {
  candles: ChartCandle[];
  relatedNews?: ChartRelatedNews[];
}

export function ChartCard({ candles, relatedNews = [] }: ChartCardProps) {
  const markers = relatedNews
    .filter((item) => item.publishedAt)
    .map((item) => ({ date: item.publishedAt.slice(0, 10), title: item.title }));

  return (
    <View style={styles.card}>
      <CandlestickChart candles={candles} height={240} markers={markers} />
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
  }
});
