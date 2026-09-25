import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { MarketStatCard } from "../../../components/MarketStatCard";
import { getMarketSummary } from "../../../lib/api";
import { sampleMarketSummary } from "../../../lib/sampleData";

export function MarketPanel() {
  const { data, isError } = useQuery({
    queryKey: ["market-summary"],
    queryFn: getMarketSummary,
    retry: 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false
  });

  const market = data ?? sampleMarketSummary;

  return (
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <Text style={styles.sectionTitle}>국내 시장 현황</Text>
        {!data ? <Text style={styles.status}>{isError ? "연결 실패 · 샘플" : "샘플"}</Text> : null}
      </View>
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
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
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
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  status: { color: "#B54708", fontSize: 11, fontWeight: "700" }
});
