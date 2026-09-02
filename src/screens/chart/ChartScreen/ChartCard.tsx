import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MiniLineChart } from "../../../components/MiniLineChart";
import type { ChartPoint } from "../../../types/api";

export function ChartCard({ points }: { points: ChartPoint[] }) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  return (
    <View style={styles.card}>
      <MiniLineChart
        points={points}
        height={220}
        highlightDate={selectedDate}
        onPointPress={(point) => setSelectedDate(point.date)}
      />
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
