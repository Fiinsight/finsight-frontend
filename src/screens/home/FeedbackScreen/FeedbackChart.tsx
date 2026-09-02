import { StyleSheet, Text, View } from "react-native";
import { MiniLineChart } from "../../../components/MiniLineChart";
import type { ChartPoint } from "../../../types/api";

interface FeedbackChartProps {
  symbolName: string;
  points: ChartPoint[];
}

export function FeedbackChart({ symbolName, points }: FeedbackChartProps) {
  const judgedDate = points[points.length - 1]?.date;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{symbolName} 주가 흐름</Text>
      <MiniLineChart points={points} height={150} highlightDate={judgedDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  title: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800"
  }
});
