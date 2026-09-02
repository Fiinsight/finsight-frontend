import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { MarketStatCard } from "../../../components/MarketStatCard";
import { getMarketSummary } from "../../../lib/api";
import { sampleMarketSummary } from "../../../lib/sampleData";

export function MarketPanel() {
  const { data } = useQuery({
    queryKey: ["market-summary"],
    queryFn: getMarketSummary,
    retry: 0
  });

  const market = data ?? sampleMarketSummary;

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>국내 시장 현황</Text>
      <View style={styles.row}>
        <MarketStatCard {...market.kospi} />
        <MarketStatCard {...market.exchangeRate} />
        <MarketStatCard {...market.baseRate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 8
  }
});
