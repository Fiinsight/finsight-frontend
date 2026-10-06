import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MiniLineChart } from "../../components/MiniLineChart";
import { getChartData, getNewsDetail } from "../../lib/api";
import type { ChartPoint } from "../../types/api";
import type { HistoryStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HistoryStackParamList, "JudgementDetail">;

function kstDateKey(value: string) {
  if (!Number.isFinite(Date.parse(value))) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return fields.year && fields.month && fields.day ? `${fields.year}-${fields.month}-${fields.day}` : "";
}

function dayTimestamp(date: string) {
  return Date.parse(`${date.slice(0, 10)}T00:00:00+09:00`);
}

export function chartWindow(candles: Array<{ date: string; close: number }>, judgedAt: string) {
  const sorted = [...candles].filter((candle) => Number.isFinite(dayTimestamp(candle.date)) && Number.isFinite(candle.close) && candle.close > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return null;

  const judgementDate = kstDateKey(judgedAt);
  if (!judgementDate) return null;
  const judgementTimestamp = dayTimestamp(judgementDate);
  const anchorIndex = sorted.reduce((best, candle, index) => {
    const bestDistance = Math.abs(dayTimestamp(sorted[best].date) - judgementTimestamp);
    const distance = Math.abs(dayTimestamp(candle.date) - judgementTimestamp);
    return distance < bestDistance ? index : best;
  }, 0);
  const distanceDays = Math.abs(dayTimestamp(sorted[anchorIndex].date) - judgementTimestamp) / 86_400_000;
  // Weekend/holiday judgments may map to a nearby trading day. Older records
  // are not shown against an unrelated recent 30-day chart.
  if (distanceDays > 3) return null;

  const start = Math.max(0, Math.min(anchorIndex - 5, sorted.length - 12));
  const visible = sorted.slice(start);
  return {
    waiting: sorted[sorted.length - 1].date.slice(0, 10) <= judgementDate,
    points: visible.map<ChartPoint>((candle) => ({ date: candle.date, value: candle.close })),
    judgementDate: sorted[anchorIndex].date,
    currentDate: sorted[sorted.length - 1].date,
    isNearestTradingDay: sorted[anchorIndex].date.slice(0, 10) !== judgementDate
  };
}

export function JudgementDetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const newsQuery = useQuery({
    queryKey: ["news-detail", item.newsId],
    queryFn: () => getNewsDetail(item.newsId),
    retry: 0,
    staleTime: 10 * 60_000
  });
  const symbol = newsQuery.data?.relatedSymbol?.trim() ?? "";
  const chartQuery = useQuery({
    queryKey: ["chart-data", symbol, "D", 5],
    queryFn: ({ signal }) => getChartData(symbol, "D", 5, signal),
    enabled: Boolean(symbol),
    retry: 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  const chart = chartQuery.data;
  const window = useMemo(
    () => chart && !chart.fallback ? chartWindow(chart.candles, item.judgedAt) : null,
    [chart, item.judgedAt]
  );
  const status = item.correct === true
    ? { label: "적중", color: "#12B76A", background: "#ECFDF3" }
    : item.correct === false
      ? { label: "불일치", color: "#D92D20", background: "#FEF3F2" }
      : item.actualResult === "UNKNOWN"
        ? { label: "확인 불가", color: "#667085", background: "#F2F4F7" }
        : { label: "결과 대기", color: "#667085", background: "#F2F4F7" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Text style={styles.back}>← 기록으로 돌아가기</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>판단 기록 상세</Text>
        <Text style={styles.title}>{item.newsTitle}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.choice}>{item.choice === "UP" ? "상승 예측" : item.choice === "DOWN" ? "하락 예측" : "중립 예측"}</Text>
          {item.actualResult && item.actualResult !== "UNKNOWN" ? <Text style={styles.actual}>실제 {item.actualResult}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 근거</Text>
          {item.reasons.length > 0 ? item.reasons.map((reason, index) => (
            <View key={`${reason}-${index}`} style={styles.reasonRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>
          )) : <Text style={styles.muted}>이 기록에는 저장된 판단 근거 목록이 없습니다.</Text>}
        </View>

        {item.feedbackText ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>피드백</Text>
            <Text style={styles.feedback}>{item.feedbackText}</Text>
          </View>
        ) : (
          <View style={styles.feedbackCard}>
            <Text style={styles.sectionTitle}>피드백</Text>
            <Text style={styles.muted}>다음 거래일 이후 실제 결과가 확인되면 피드백이 표시됩니다.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 전후 가격 흐름</Text>
          {newsQuery.isLoading || (symbol && chartQuery.isLoading) ? (
            <Text style={styles.muted}>실제 가격 흐름을 확인하는 중이에요.</Text>
          ) : chartQuery.isError || newsQuery.isError ? (
            <>
              <Text style={styles.muted}>{chartQuery.error?.name === "ChartFallbackError"
                ? "실제 시세 데이터가 없습니다 (fallback). 저장된 판단과 피드백은 그대로 표시합니다."
                : "가격 데이터 조회에 실패했습니다. 다시 시도해 주세요. 저장된 판단과 피드백은 그대로 표시합니다."}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => {
                if (newsQuery.isError) void newsQuery.refetch();
                else void chartQuery.refetch();
              }}>
                <Text style={styles.back}>다시 시도</Text>
              </TouchableOpacity>
            </>
          ) : !symbol ? (
            <Text style={styles.muted}>연결된 종목이 없어 가격 흐름을 표시할 수 없습니다.</Text>
          ) : chart?.fallback ? (
            <Text style={styles.muted}>실제 시세 데이터가 없습니다 (fallback).</Text>
          ) : !window ? (
            <Text style={styles.muted}>판단일 주변의 실제 거래 데이터가 없어 가격 흐름을 표시하지 않습니다.</Text>
          ) : window.waiting ? (
            <Text style={styles.muted}>판단 이후의 거래일 데이터가 아직 없어 비교할 데이터가 부족합니다. 다음 거래일 데이터가 들어오면 가격 흐름을 표시합니다.</Text>
          ) : (
            <>
              <Text style={styles.chartNote}>{window.isNearestTradingDay ? "판단일과 가장 가까운 거래일을 기준으로 표시했어요." : "판단일과 현재 시점의 실제 종가 흐름이에요."}</Text>
              <MiniLineChart
                points={window.points}
                height={180}
                highlightDate={window.judgementDate}
                markers={[
                  { date: window.judgementDate, label: "판단", color: "#F79009" },
                  { date: window.currentDate, label: "현재", color: "#175CD3" }
                ]}
              />
            </>
          )}
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
