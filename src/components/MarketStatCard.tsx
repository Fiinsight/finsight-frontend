import { StyleSheet, Text, View } from "react-native";
import type { MarketStat } from "../types/api";

const toneStyle = StyleSheet.create({
  up: { color: "#D92D20" },
  down: { color: "#175CD3" },
  flat: { color: "#475467" }
});

export function MarketStatCard({ label, value, change, tone }: MarketStat) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statChange, toneStyle[tone]]}>{change}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    flex: 1,
    padding: 10
  },
  statLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "700"
  },
  statValue: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6
  },
  statChange: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  }
});
