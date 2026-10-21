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
  const reviewOnly = !result.pending && (result.unavailable || result.legacy);
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
  const choiceName = item.choice === "UP" ? "상승" : item.choice === "DOWN" ? "하락" : "중립";
  const expectedDate = item.expectedResultDate ? resultDateLabel(item.expectedResultDate) : null;
  const delayed = !!item.expectedResultAt && Number.isFinite(Date.parse(item.expectedResultAt)) && Date.parse(item.expectedResultAt) <= Date.now();
  const waitingHeadline = delayed ? "채점이 지연되고 있어요" : "아직 채점 전이에요";
  const headline = verdict === "CORRECT" ? `${choiceName} 예측이 맞았어요`
    : verdict === "WRONG" ? `${choiceName} 예측과 달랐어요` : verdict === "PARTIAL" ? `${choiceName} 방향은 같았어요 · 소폭 변동`
    : reviewOnly ? "아직 채점되지 않았어요" : waitingHeadline;
  const tone = verdict === "CORRECT" ? "#ECFDF3" : verdict === "WRONG" ? "#FFF4ED" : "#F2F4F7";
  const percent = item.actualChangePercent == null ? "등락률 확인 불가" : `${item.actualChangePercent > 0 ? "+" : ""}${item.actualChangePercent.toFixed(2)}%`;
  const movement = item.actualDirection === "UP" ? "상승" : item.actualDirection === "DOWN" ? "하락" : "중립";
  const feedbackMatchesResult = !verdict || !item.verdict || item.verdict === verdict;
  const storedReasons = result.pending || !feedbackMatchesResult ? null : item.feedbackReasons;
  const feedbackText = feedbackMatchesResult ? result.feedbackText : "저장된 설명 문구가 실제 방향 비교와 달라 표시하지 않았어요. 위 결과는 내 예측과 저장된 실제 방향을 비교한 값이에요.";
  const coachingTitles = ["내 근거 점검", "판단 근거", "내 판단 돌아보기", "근거 남기기"];
  const coachingReasons = storedReasons?.filter(reason => coachingTitles.includes(reason.title));
  const explanationReasons = storedReasons?.filter(reason => !coachingTitles.includes(reason.title));
  const pricePoints = points && (chartPoints.length === 0 || points[0].date < chartPoints[0].date || points[1].date > chartPoints[chartPoints.length - 1].date) ? points : chartPoints;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenTopBar title="판단 기록" onBack={() => navigation.goBack()} />

        <Text style={styles.eyebrow}>판단 기록 상세</Text>
        <Text style={styles.title}>{item.newsTitle}</Text>
        <View style={[styles.resultCard, { backgroundColor: tone }]} accessibilityRole="summary">
          <Text style={styles.eyebrow}>채점 결과</Text>
          <Text style={styles.resultHeadline}>{headline}</Text>
          <View style={styles.outcomeRow} accessibilityRole="summary" accessibilityLabel="내 예측과 실제 결과 비교">
            <View style={styles.outcomeCell}><Text style={styles.muted}>내 예측</Text><Text style={styles.outcomeValue}>{choiceName}</Text></View>
            <Text style={styles.outcomeArrow}>→</Text>
            <View style={styles.outcomeCell}><Text style={styles.muted}>실제 결과</Text><Text style={styles.outcomeValue}>{verdict ? `${movement} ${percent}` : "확인 전"}</Text></View>
          </View>
          {verdict ? <Text style={styles.muted}>{`${stockName || symbol || "판단 대상"} · ${judgementDate} → ${item.comparisonDate} 종가 비교`}</Text> : null}
          {verdict === "PARTIAL" ? <Text style={styles.muted}>변동 폭이 1% 이하인 결과예요.</Text> : null}
          {result.pending ? <Text style={styles.muted}>{expectedDate ? `예정 비교일: ${expectedDate} · 장 마감 종가가 필요해요.` : "다음 거래일의 장 마감 종가가 필요해요."}</Text> : null}
          {verdict && item.indexChangePercent != null && item.indexName ? <View style={styles.marketFigures} accessibilityRole="summary" accessibilityLabel="종목과 같은 날 시장 등락률 비교">
            <Text style={styles.marketValue}>{stockName || symbol} {percent}</Text>
            <Text style={styles.marketValue}>같은 날 {item.indexName} {item.indexChangePercent >= 0 ? "+" : ""}{item.indexChangePercent.toFixed(2)}%</Text>
          </View> : null}
          {reviewOnly ? <Text style={styles.muted}>{item.unavailableReason || (result.legacy ? "당일 가격으로 비교한 기록이라 다음 거래일 적중 통계에는 포함하지 않아요." : "비교할 가격이 없어 적중 여부 대신 기사 내용으로 복습해요.")}</Text> : null}
        </View>
        {detailQuery.isError ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="판단 결과 다시 시도" onPress={() => void detailQuery.refetch()}><Text style={styles.back}>최신 결과 다시 시도</Text></TouchableOpacity> : null}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>내 근거 점검</Text>
          {item.reasons.length > 0 ? item.reasons.map((reason, index) => (
            <View key={`${reason}-${index}`} style={styles.reasonRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>
          )) : !coachingReasons?.length ? <Text style={styles.muted}>남긴 판단 근거가 없어요.</Text> : null}
          {coachingReasons?.length ? <View style={styles.coaching}>
            {coachingReasons.map((reason,index) => <Text key={`${reason.title}-${index}`} style={styles.feedback}>{reason.detail}</Text>)}
          </View> : null}
        </View>

        {!result.pending && feedbackText ? <View style={styles.feedbackCard}>
          <Text style={styles.sectionTitle}>{reviewOnly ? "기사에서 볼 근거" : verdict === "CORRECT" ? "왜 맞았을까요?" : verdict === "WRONG" ? "왜 빗나갔을까요?" : verdict === "PARTIAL" ? "왜 변동이 작았을까요?" : "피드백"}</Text>
          {explanationReasons?.length ? explanationReasons.map((reason, index) => <View key={`${reason.title}-${index}`} style={styles.reasonRow}>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.reasonCopy}><Text style={styles.reasonTitle}>{reason.title}</Text><Text style={styles.feedback}>{reason.detail}</Text></View>
          </View>) : <Text style={styles.feedback}>{feedbackText}</Text>}
          {reviewOnly ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="이 기사 다시 읽기" onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId })}><Text style={styles.back}>이 기사 다시 읽기 →</Text></TouchableOpacity> : null}
          {verdict && item.conceptTerm ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.conceptTerm} 퀴즈로 확인하기`} style={styles.conceptLink}
            onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId, readMode: "level", openQuiz: true, quizTerm: item.conceptTerm! })}>
            <Text style={styles.reasonTitle}>배울 개념: {item.conceptTerm}</Text>
            {item.conceptDefinition ? <Text style={styles.feedback}>{item.conceptDefinition}</Text> : null}
            <Text style={styles.back}>퀴즈로 확인하기 →</Text>
          </TouchableOpacity> : null}
          {storedReasons?.length ? <Text style={styles.muted}>{reviewOnly ? "기사에서 확인한 사실과 가능한 영향 경로를 정리했어요." : "가격 변화가 이 뉴스 때문이라고 단정할 수는 없어요."}</Text> : null}
        </View> : null}
        {canShowPrices ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>판단 전후 가격 흐름</Text>
          {symbol ? <Text style={styles.choice}>{stockName ? `${stockName} ${symbol}` : symbol}</Text> : null}
          {points ? <Text style={styles.chartNote}>{`판단일 기준 종가 ${points[0].value.toLocaleString("ko-KR")} · 비교일 종가 ${points[1].value.toLocaleString("ko-KR")} (${item.actualChangePercent != null ? `${item.actualChangePercent > 0 ? "+" : ""}${item.actualChangePercent.toFixed(2)}%` : "등락률 확인 불가"})`}</Text> : null}
          {chartQuery.isError && points ? <><Text style={styles.muted}>가격 차트를 불러오지 못했어요. 저장된 판단 기준·결과 종가를 비교해요.</Text><TouchableOpacity accessibilityRole="button" style={styles.retryTarget} accessibilityLabel="가격 흐름 다시 시도" onPress={() => void chartQuery.refetch()}><Text style={styles.back}>다시 시도</Text></TouchableOpacity></> : null}
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
  retryTarget: { minHeight: 44, justifyContent: "center" },
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 24, gap: 14 },
  resultCard: { borderRadius: 16, padding: 20, gap: 10 },
  resultHeadline: { fontSize: 20, fontWeight: "800", color: "#101828", lineHeight: 28 },
  outcomeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  outcomeCell: { flex: 1, gap: 5 },
  outcomeValue: { fontSize: 19, fontWeight: "800", color: "#101828", lineHeight: 27 },
  outcomeArrow: { fontSize: 22, color: "#667085" },
  marketFigures: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  marketValue: { fontSize: 15, fontWeight: "700", color: "#344054", lineHeight: 22 },
  conceptLink: { gap: 6, paddingVertical: 10 },
  reasonCopy: { flex: 1, gap: 5 },
  reasonTitle: { fontSize: 15, fontWeight: "700", color: "#101828" },
  coaching: { borderTopWidth: 1, borderTopColor: "#EAECF0", paddingTop: 10, gap: 8 },
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
