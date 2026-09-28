import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { MarketStatCard } from "../../../components/MarketStatCard";
import { getMarketSummary } from "../../../lib/api";

export function MarketPanel() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["market-summary"],
    queryFn: getMarketSummary,
    retry: 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false
  });

  const market = data;

  return (
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <Text style={styles.sectionTitle}>국내 시장 현황</Text>
        {!data ? <Text style={styles.status}>{isPending ? "불러오는 중" : isError ? "연결 확인 필요" : ""}</Text> : null}
      </View>
      {market ? (
        <View style={styles.row}>
          <MarketStatCard {...market.kospi} />
          <MarketStatCard {...market.exchangeRate} />
          <MarketStatCard {...market.baseRate} />
        </View>
      ) : (
        <Text style={styles.loading}>{isError ? "실제 시장 데이터를 불러오지 못했어요." : "시장 현황을 불러오는 중이에요."}</Text>
      )}
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
  status: { color: "#B54708", fontSize: 11, fontWeight: "700" },
  loading: { color: "#667085", fontSize: 14, paddingVertical: 12 }
});
