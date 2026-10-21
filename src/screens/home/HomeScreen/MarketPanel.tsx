import { colors, radius, spacing, typography } from "../../../theme";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MarketStatCard } from "../../../components/MarketStatCard";
import { getMarketSummary } from "../../../lib/api";

export function MarketPanel() {
  const isFocused = useIsFocused();
  const { data, isError, isPending, refetch } = useQuery({
    queryKey: ["market-summary"],
    queryFn: getMarketSummary,
    retry: 0,
    staleTime: 60_000,
    enabled: isFocused,
    refetchInterval: isFocused ? 60_000 : false,
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
      {isError ? <Pressable accessibilityRole="button" onPress={() => void refetch()}><Text style={styles.loading}>시장 현황 다시 시도</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.size.subheading,
    fontWeight: typography.weight.bold
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  status: { color: colors.warning, fontSize: 11, fontWeight: typography.weight.bold },
  loading: { color: colors.muted, fontSize: typography.size.body, paddingVertical: spacing.sm }
});
