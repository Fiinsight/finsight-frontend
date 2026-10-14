import { resultDateLabel } from "../../lib/judgementResults";
import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { recordJudgementView } from "../../lib/readingProgress";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { judgementClosingPoints, judgementResult, kstDate, feedbackVerdict } from "../../lib/historyRecords";
import { ScreenTopBar } from "../../components/ScreenTopBar";
import { MiniLineChart } from "../../components/MiniLineChart";
import { getChartData, getJudgementDetail, getNewsDetail, searchStocks } from "../../lib/api";
import type { HistoryStackParamList } from "../../navigation/types";

import { markFeedbackSeen } from "../../lib/feedbackSeen";

type Props = NativeStackScreenProps<HistoryStackParamList, "JudgementDetail">;

export function JudgementDetailScreen({ route, navigation }: Props) {
  const focused = useIsFocused();
  const initial = route.params.item;
  const detailQuery = useQuery({ queryKey: ["judgement-detail", initial.id], queryFn: ({ signal }) => getJudgementDetail(initial.id, signal),
    enabled: Number.isSafeInteger(initial.id) && initial.id > 0, retry: 0, staleTime: 60_000,
    refetchInterval: query => focused && !(query.state.data?.actualDirection ?? initial.actualDirection) ? 60_000 : false });
  const item = Number.isSafeInteger(detailQuery.data?.id) && detailQuery.data?.id === initial.id ? detailQuery.data : initial;
  const client = useQueryClient();
  useEffect(() => {
    if (focused) void recordJudgementView(item.id).then(() => client.invalidateQueries({ queryKey: ["learning-progress"] }));
  }, [focused, item.id, client]);
  useEffect(() => { if (focused) void markFeedbackSeen(item).catch(() => {}); }, [focused, item.id, item.feedbackGeneratedAt, item.comparisonDate]);
  const newsQuery = useQuery({
    queryKey: ["news-detail", item.newsId],
    queryFn: () => getNewsDetail(item.newsId),
    retry: 0,
    staleTime: 10 * 60_000
  });
  const result = judgementResult(item);
  const invalidTarget = item.gradingIssue === "TARGET_MISMATCH";
  const canShowPrices = !result.pending && !result.unavailable && !result.legacy;
  const symbol = item.relatedSymbol?.trim() || newsQuery.data?.relatedSymbol?.trim() || "";
  const indexSymbol = symbol === "KOSPI" || symbol === "KOSDAQ";
  const points = judgementClosingPoints(item);
  const chartQuery = useQuery({
    queryKey: ["chart", symbol, "D"],
    queryFn: ({ signal }) => getChartData(symbol, "D", 5, signal),
    enabled: canShowPrices && /^\d{6}$/.test(symbol),
    staleTime: 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  const stockQuery = useQuery({
    queryKey: ["stock-search", symbol],
    queryFn: () => searchStocks(symbol),
    enabled: canShowPrices && /^\d{6}$/.test(symbol) && (!newsQuery.data?.relatedSymbolName || newsQuery.data.relatedSymbolName === symbol),
    staleTime: 10 * 60_000,
    retry: 0
  });
  const storedName = item.relatedSymbolName?.trim() || newsQuery.data?.relatedSymbolName?.trim();
  const stockName = storedName && storedName !== symbol ? storedName : stockQuery.data?.find(stock => stock.symbol === symbol)?.name;
  const chartPoints = chartQuery.data?.points ?? [];
  const judgementDate = kstDate(item.judgedAt);
  const verdict = feedbackVerdict(item);
  const hasReason = Boolean(item.reasonText?.trim() || item.reasons.length);
  const expectedDate = item.expectedResultDate ? resultDateLabel(item.expectedResultDate) : null;
  const delayed = !!item.expectedResultAt && Number.isFinite(Date.parse(item.expectedResultAt)) && Date.parse(item.expectedResultAt) <= Date.now();
  const waitingHeadline = delayed ? "결과를 확인하고 있어요" : expectedDate ? `${expectedDate} 장 마감 후(15:40 이후) 결과를 알려드려요` : "다음 거래일 장 마감 후 결과를 알려드려요";
  const headline = verdict === "CORRECT" ? hasReason ? "✓ 정확한 판단이에요!" : "예측 방향이 같았어요"
    : verdict === "WRONG" ? "다르게 움직였어요" : verdict === "PARTIAL" ? "방향은 맞았지만 변동이 작았어요"
    : invalidTarget ? "채점 대상을 다시 확인해야 해요" : result.unavailable ? "판단 대상이 정해지지 않은 기사예요" : result.legacy ? "이전 방식으로 채점된 기록이에요(당일 비교)" : waitingHeadline;
  const tone = verdict === "CORRECT" ? "#ECFDF3" : verdict === "WRONG" ? "#FFF4ED" : "#F2F4F7";
  const percent = item.actualChangePercent == null ? "등락률 확인 불가" : `${item.actualChangePercent > 0 ? "+" : ""}${item.actualChangePercent.toFixed(2)}%`;
  const movement = item.actualDirection === "UP" ? "상승" : item.actualDirection === "DOWN" ? "하락" : "보합";
  const storedReasons = verdict ? item.feedbackReasons : null;
  const pricePoints = points && (chartPoints.length === 0 || points[0].date < chartPoints[0].date || points[1].date > chartPoints[chartPoints.length - 1].date) ? points : chartPoints;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenTopBar title="판단 기록" onBack={() => navigation.goBack()} />

        <Text style={styles.eyebrow}>판단 기록 상세</Text>
        <Text style={styles.title}>{item.newsTitle}</Text>
        <View style={[styles.resultCard, { backgroundColor: tone }]} accessibilityRole="summary">
          <Text style={styles.resultHeadline}>{headline}</Text>
          {verdict ? <Text style={styles.feedback}>{`실제 ${stockName || symbol || "판단 대상"} ${item.comparisonDate} 종가는 판단일 대비 ${percent} ${movement}`}</Text> : result.pending ? <Text style={styles.muted}>휴장일이면 다음 거래일 장 마감 기준으로 알려드려요.</Text> : null}
          {verdict && item.indexChangePercent != null && item.indexName ? <View style={styles.marketFigures} accessibilityRole="summary" accessibilityLabel="종목과 같은 날 시장 등락률 비교">
            <Text style={styles.marketValue}>{stockName || symbol} {percent}</Text>
            <Text style={styles.marketValue}>같은 날 {item.indexName} {item.indexChangePercent >= 0 ? "+" : ""}{item.indexChangePercent.toFixed(2)}%</Text>
          </View> : null}
          {result.unavailable && !invalidTarget ? <Text style={styles.muted}>{item.unavailableReason || "판단 대상이 정해지지 않은 기사예요"}. 대상이 표시된 다른 기사에서 판단해보세요.</Text> : null}
          <Text style={styles.choice}>{item.choice === "UP" ? "상승 예측" : item.choice === "DOWN" ? "하락 예측" : "중립 예측"}</Text>
        </View>
        {detailQuery.isError ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="판단 결과 다시 시도" onPress={() => void detailQuery.refetch()}><Text style={styles.back}>최신 결과 다시 시도</Text></TouchableOpacity> : null}
        {result.pending || !storedReasons?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 근거</Text>
          {item.reasons.length > 0 ? item.reasons.map((reason, index) => (
            <View key={`${reason}-${index}`} style={styles.reasonRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>
          )) : <Text style={styles.muted}>남긴 판단 근거가 없어요.</Text>}
        </View>

        ) : null}

        {!result.pending && result.feedbackText ? <View style={styles.feedbackCard}>
          <Text style={styles.sectionTitle}>{invalidTarget || result.legacy ? "이전 기록 안내" : storedReasons?.length ? item.actualDirection === "UP" ? "왜 올랐을까요?" : item.actualDirection === "DOWN" ? "왜 내렸을까요?" : "왜 크게 움직이지 않았을까요?" : "피드백"}</Text>
          {storedReasons?.length ? storedReasons.map((reason, index) => <View key={`${reason.title}-${index}`} style={styles.reasonRow}>
            <Text style={styles.bullet}>{verdict === "CORRECT" ? "✓" : "!"}</Text>
            <View style={styles.reasonCopy}><Text style={styles.reasonTitle}>{reason.title}</Text><Text style={styles.feedback}>{reason.detail}</Text></View>
          </View>) : <Text style={styles.feedback}>{result.feedbackText}</Text>}
          {invalidTarget || result.legacy ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="이 기사 다시 읽기" onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId })}><Text style={styles.back}>이 기사 다시 읽기 →</Text></TouchableOpacity> : null}
          {verdict && item.conceptTerm ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.conceptTerm} 퀴즈로 확인하기`} style={styles.conceptLink}
            onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId, readMode: "level", openQuiz: true, quizTerm: item.conceptTerm! })}>
            <Text style={styles.reasonTitle}>배울 개념: {item.conceptTerm}</Text>
            {item.conceptDefinition ? <Text style={styles.feedback}>{item.conceptDefinition}</Text> : null}
            <Text style={styles.back}>퀴즈로 확인하기 →</Text>
          </TouchableOpacity> : null}
          {storedReasons?.length ? <Text style={styles.muted}>가격 변화가 이 뉴스 때문이라고 단정할 수는 없어요.</Text> : null}
        </View> : null}
        {verdict && item.nextTip ? <View style={styles.tipCard}><Text style={styles.feedback}>💡 {item.nextTip}</Text></View> : null}
        {canShowPrices ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 전후 가격 흐름</Text>
          {symbol ? <Text style={styles.choice}>{stockName ? `${stockName} ${symbol}` : symbol}</Text> : null}
          {points ? <Text style={styles.chartNote}>{`판단일 기준 종가 ${points[0].value.toLocaleString("ko-KR")} · 비교일 종가 ${points[1].value.toLocaleString("ko-KR")} (${item.actualChangePercent != null ? `${item.actualChangePercent > 0 ? "+" : ""}${item.actualChangePercent.toFixed(2)}%` : "등락률 확인 불가"})`}</Text> : null}
          {chartQuery.isError && points ? <><Text style={styles.muted}>가격 차트를 불러오지 못했어요. 저장된 판단 기준·결과 종가를 비교해요.</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="가격 흐름 다시 시도" onPress={() => void chartQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity></> : null}
          {newsQuery.isLoading ? <Text style={styles.muted}>관련 종목을 확인하는 중이에요.</Text>
          : newsQuery.isError ? <><Text style={styles.muted}>관련 종목 조회에 실패했습니다.</Text><TouchableOpacity accessibilityRole="button" onPress={() => void newsQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity></>
          : !symbol ? <Text style={styles.muted}>연결된 종목이 없어 가격 흐름을 표시할 수 없습니다.</Text>
          : indexSymbol && pricePoints.length === 0 ? <Text style={styles.muted}>지수 종가 비교 데이터를 확인할 수 없어요.</Text>
          : chartQuery.isLoading ? <Text style={styles.muted}>가격 차트를 불러오는 중이에요.</Text>
          : pricePoints.length === 0 ? <>
              <Text style={styles.muted}>가격 차트를 불러오지 못했어요</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void chartQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity>
            </>
          : <>
              <MiniLineChart points={pricePoints} height={180} highlightDate={judgementDate} showTooltip={false}
                highlightRange={item.comparisonDate && !result.legacy ? { from: judgementDate, to: item.comparisonDate, color: tone } : undefined} markers={[
                {date: judgementDate, label: "판단", color: "#F79009", kind: "line"},
                ...(item.comparisonDate && !result.legacy ? [{date: item.comparisonDate, label: `결과 ${percent}`, color: "#175CD3", kind: "point" as const}] : [])
              ]} />
            </>}
          {!points && !result.legacy && /^\d{6}$/.test(symbol) ? <Text style={styles.chartNote}>저장된 비교 종가를 확인할 수 없어요</Text> : null}

        </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}><TouchableOpacity accessibilityRole="button" accessibilityLabel="완료, 판단 기록 목록으로" style={styles.doneButton} onPress={() => navigation.navigate("History", { initialTab: "judgements" })}><Text style={styles.doneText}>완료</Text></TouchableOpacity></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 24, gap: 14 },
  resultCard: { borderRadius: 16, padding: 20, gap: 10 },
  resultHeadline: { fontSize: 20, fontWeight: "800", color: "#101828", lineHeight: 28 },
  marketFigures: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  marketValue: { fontSize: 15, fontWeight: "700", color: "#344054", lineHeight: 22 },
  conceptLink: { gap: 6, paddingVertical: 10 },
  reasonCopy: { flex: 1, gap: 5 },
  reasonTitle: { fontSize: 15, fontWeight: "700", color: "#101828" },
  tipCard: { backgroundColor: "#FFFAEB", padding: 16, borderRadius: 14 },
  footer: { backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingVertical: 12, borderTopColor: "#EAECF0", borderTopWidth: 1 },
  doneButton: { backgroundColor: "#175CD3", borderRadius: 12, minHeight: 48, alignItems: "center", justifyContent: "center" },
  doneText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  back: { color: "#175CD3", fontSize: 14, fontWeight: "700" },
  eyebrow: { color: "#667085", fontSize: 13, fontWeight: "700", marginTop: 4 },
  title: { color: "#101828", fontSize: 21, fontWeight: "800", lineHeight: 29 },
  choice: { color: "#475467", fontSize: 13, fontWeight: "700" },
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
