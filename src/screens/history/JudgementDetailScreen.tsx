import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { recordJudgementView } from "../../lib/readingProgress";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { judgementClosingPoints, judgementResult, kstDate } from "../../lib/historyRecords";
import { ScreenTopBar } from "../../components/ScreenTopBar";
import { MiniLineChart } from "../../components/MiniLineChart";
import { getChartData, getNewsDetail, searchStocks } from "../../lib/api";
import type { HistoryStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HistoryStackParamList, "JudgementDetail">;

export function JudgementDetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const focused = useIsFocused();
  const client = useQueryClient();
  useEffect(() => {
    if (focused) void recordJudgementView(item.id).then(() => client.invalidateQueries({ queryKey: ["learning-progress"] }));
  }, [focused, item.id, client]);
  const newsQuery = useQuery({
    queryKey: ["news-detail", item.newsId],
    queryFn: () => getNewsDetail(item.newsId),
    retry: 0,
    staleTime: 10 * 60_000
  });
  const symbol = newsQuery.data?.relatedSymbol?.trim() ?? "";
  const indexSymbol = symbol === "KOSPI" || symbol === "KOSDAQ";
  const points = judgementClosingPoints(item);
  const chartQuery = useQuery({
    queryKey: ["chart", symbol, "D"],
    queryFn: ({ signal }) => getChartData(symbol, "D", 5, signal),
    enabled: /^\d{6}$/.test(symbol),
    staleTime: 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const stockQuery = useQuery({
    queryKey: ["stock-search", symbol],
    queryFn: () => searchStocks(symbol),
    enabled: /^\d{6}$/.test(symbol) && (!newsQuery.data?.relatedSymbolName || newsQuery.data.relatedSymbolName === symbol),
    staleTime: 10 * 60_000,
    retry: 0
  });
  const stockName = newsQuery.data?.relatedSymbolName !== symbol ? newsQuery.data?.relatedSymbolName : stockQuery.data?.find(stock => stock.symbol === symbol)?.name;
  const chartPoints = chartQuery.data?.points ?? [];
  const judgementDate = kstDate(item.judgedAt);
  const result = judgementResult(item);
  const status = result.legacy ? { label: "이전 방식", color: "#667085", background: "#F2F4F7" } : result.correct === true
    ? { label: "적중", color: "#12B76A", background: "#ECFDF3" }
    : result.correct === false
      ? { label: "불일치", color: "#D92D20", background: "#FEF3F2" }
      : result.unavailable
        ? { label: "비교 불가", color: "#667085", background: "#F2F4F7" }
        : { label: "결과 대기", color: "#667085", background: "#F2F4F7" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenTopBar title="판단 기록" onBack={() => navigation.goBack()} />

        <Text style={styles.eyebrow}>판단 기록 상세</Text>
        <Text style={styles.title}>{item.newsTitle}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.choice}>{item.choice === "UP" ? "상승 예측" : item.choice === "DOWN" ? "하락 예측" : "중립 예측"}</Text>
          <Text style={styles.actual}>{result.label}</Text>
        </View>

        {result.legacy ? <Text style={styles.chartNote}>이전 방식으로 채점된 기록이에요(당일 비교)</Text> : null}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 근거</Text>
          {item.reasons.length > 0 ? item.reasons.map((reason, index) => (
            <View key={`${reason}-${index}`} style={styles.reasonRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>
          )) : <Text style={styles.muted}>이 기록에는 저장된 판단 근거 목록이 없습니다.</Text>}
        </View>

        {result.feedbackText ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>피드백</Text>
            <Text style={styles.feedback}>{result.feedbackText}</Text>
          </View>
        ) : (
          <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>피드백</Text>
            <Text style={styles.muted}>{result.legacy ? "이 기록의 피드백을 확인할 수 없어요." : "다음 거래일 이후 실제 결과가 확인되면 피드백이 표시됩니다."}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 전후 가격 흐름</Text>
          {symbol ? <Text style={styles.choice}>{stockName ? `${stockName} ${symbol}` : symbol}</Text> : null}
          {points ? <Text style={styles.chartNote}>{`판단일 기준 종가 ${points[0].value.toLocaleString("ko-KR")} · 비교일 종가 ${points[1].value.toLocaleString("ko-KR")} (${item.actualChangePercent != null ? `${item.actualChangePercent > 0 ? "+" : ""}${item.actualChangePercent.toFixed(2)}%` : "등락률 확인 불가"})`}</Text> : null}
          {newsQuery.isLoading ? <Text style={styles.muted}>관련 종목을 확인하는 중이에요.</Text>
          : newsQuery.isError ? <><Text style={styles.muted}>관련 종목 조회에 실패했습니다.</Text><TouchableOpacity accessibilityRole="button" onPress={() => void newsQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity></>
          : !symbol ? <Text style={styles.muted}>연결된 종목이 없어 가격 흐름을 표시할 수 없습니다.</Text>
          : indexSymbol ? <Text style={styles.muted}>지수 차트는 준비 중입니다.</Text>
          : chartQuery.isLoading ? <Text style={styles.muted}>가격 차트를 불러오는 중이에요.</Text>
          : chartQuery.isError || chartPoints.length === 0 ? <>
              <Text style={styles.muted}>가격 차트를 불러오지 못했어요</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void chartQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity>
            </>
          : <>
              <MiniLineChart points={chartPoints} height={180} highlightDate={judgementDate} markers={[
                {date: judgementDate, label: "판단일", color: "#F79009"},
                ...(points ? [{date: points[1].date, label: "비교일", color: "#175CD3"}] : [])
              ]} />
            </>}
          {!points && !result.legacy && /^\d{6}$/.test(symbol) ? <Text style={styles.chartNote}>결과 비교 종가는 다음 판정 때 저장돼요</Text> : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 40, gap: 14 },
  back: { color: "#175CD3", fontSize: 14, fontWeight: "700" },
  eyebrow: { color: "#667085", fontSize: 13, fontWeight: "700", marginTop: 4 },
  title: { color: "#101828", fontSize: 21, fontWeight: "800", lineHeight: 29 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 9, flexWrap: "wrap" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: "800" },
  choice: { color: "#475467", fontSize: 13, fontWeight: "700" },
  actual: { color: "#667085", fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#EAECF0", borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  feedbackCard: { backgroundColor: "#EEF4FF", borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { color: "#101828", fontSize: 16, fontWeight: "800" },
  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { color: "#175CD3", fontSize: 18, lineHeight: 20 },
  reason: { flex: 1, color: "#344054", fontSize: 14, lineHeight: 21 },
  feedback: { color: "#344054", fontSize: 14, lineHeight: 22 },
  muted: { color: "#667085", fontSize: 13, lineHeight: 20 },
  chartNote: { color: "#667085", fontSize: 12, lineHeight: 18 }
});
