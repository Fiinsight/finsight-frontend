import { evidenceCandidates } from "../../../lib/learningPreferences";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, Pressable } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { ScreenTopBar } from "../../../components/ScreenTopBar";
import axios from "axios";
import { getLearningPreferences, getJudgementHistory, getNewsDetail, submitJudgement } from "../../../lib/api";
import type { NewsFlowParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import type { JudgementChoice } from "../../../types/api";
import { DirectionChoices } from "./DirectionChoices";
import { NewsSummaryCard } from "./NewsSummaryCard";
import { ReasonInput } from "./ReasonInput";

type Props = NativeStackScreenProps<NewsFlowParamList, "Judgement">;

export function JudgementScreen({ route, navigation }: Props) {
  const { newsId } = route.params;
  const queryClient = useQueryClient();
  const draft = useAppStore((state) => state.judgementDraftByNewsId[newsId]);
  const history = useQuery({queryKey: ["judgement-history", "existing"], queryFn: ({ signal }) => getJudgementHistory(signal), retry: 0, staleTime: 0});
  const existing = history.data?.find((item) => item.newsId === newsId);
  const confirmed = Boolean(existing?.actualDirection);
  const choice = confirmed ? existing?.choice : draft?.choice ?? existing?.choice;
  const reason = (confirmed ? existing?.reasons.join("\n") : draft?.reason ?? existing?.reasons.join("\n")) ?? "";
  const setJudgementChoice = useAppStore((state) => state.setJudgementChoice);
  const setJudgementReason = useAppStore((state) => state.setJudgementReason);
  const clearJudgementDraft = useAppStore((state) => state.clearJudgementDraft);
  const [recommendEvidence, setRecommendEvidence] = useState(false);
  useEffect(() => { void getLearningPreferences().then(value => setRecommendEvidence(value.painPoint === "evidence")); }, []);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0,
    staleTime: 60_000
  });

  const symbol = data?.relatedSymbol;
  const marketLabel = symbol === "KOSPI" ? "관련 시장(코스피)" : symbol === "KOSDAQ" ? "관련 시장(코스닥)" : null;
  const symbolLabel = marketLabel ?? (data?.relatedSymbolName && data.relatedSymbolName !== symbol ? `${data.relatedSymbolName} 주가` : symbol ? `관련 종목(${symbol}) 주가` : "관련 기업이나 시장");

  const mutation = useMutation({
    mutationFn: () => submitJudgement({ newsId, choice: choice as JudgementChoice, reason: reason || undefined })
  });

  const handleSubmit = async () => {
    if (!choice) {
      return;
    }
    setSubmitError(null);
    try {
      const ack = await mutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["judgement-history"] });
      void queryClient.invalidateQueries({ queryKey: ["learning-progress"] });
      void queryClient.invalidateQueries({ queryKey: ["learning-recommendations"] });
      clearJudgementDraft(newsId);
      navigation.navigate("Feedback", { newsId, ack });
    } catch (error) {
      // Real market/AI feedback can't exist yet at submit time either way —
      // but if the submission itself failed, the judgement was never saved,
      // so showing a "success" screen here would be actively misleading.
      // Let the user retry instead.
      setSubmitError(axios.isAxiosError(error) && error.response?.status === 409 ? "이미 결과가 나온 판단이에요" : "서버에 연결하지 못해 판단이 저장되지 않았어요. 다시 시도해주세요.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTopBar title="판단하기" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.question}>{`이 뉴스가 다음 거래일 ${symbolLabel}에 미칠 영향은?`}</Text>
          <Text style={styles.subtitle}>{marketLabel ? "뉴스 내용을 바탕으로 지수 방향을 예측해보세요" : "뉴스 내용을 바탕으로 주가 방향을 예측해보세요"}</Text>

          {isLoading ? <Text style={styles.errorText}>뉴스를 불러오는 중이에요.</Text> : null}
          {isError || (!isLoading && !data) ? <Text style={styles.errorText}>실제 뉴스를 확인할 수 없어 판단을 저장할 수 없어요. 이전 화면에서 다시 시도해주세요.</Text> : null}
          {isError ? <Pressable accessibilityRole="button" onPress={() => void refetch()}><Text>뉴스 다시 시도</Text></Pressable> : null}
          <Text style={styles.subtitle}>학습용 서비스이며 투자 권유가 아닙니다.</Text>
          {data ? <NewsSummaryCard summary={data.summary} /> : null}
          {history.isError ? <Pressable accessibilityRole="button" onPress={() => void history.refetch()}><Text style={styles.errorText}>기존 판단을 확인하지 못했어요. 다시 시도</Text></Pressable> : null}
          {confirmed ? <Text style={styles.errorText}>이미 결과가 나온 판단이에요</Text> : existing ? <Text style={styles.subtitle}>저장된 판단을 수정할 수 있어요.</Text> : null}
          <Text style={styles.subtitle}>다음 거래일 종가의 변화가 ±0.5% 이내면 중립으로 비교해요.</Text>
          {data ? <DirectionChoices isIndex={!!marketLabel} disabled={confirmed} value={choice} onChange={(next) => { if (!confirmed) { setJudgementReason(newsId, reason); setJudgementChoice(newsId, next); } }} /> : null}
          {data ? <ReasonInput recommended={recommendEvidence} candidates={evidenceCandidates(data.summary)} editable={!confirmed} value={reason} onChange={(text) => setJudgementReason(newsId, text)} /> : null}

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar label={existing && !confirmed ? "판단 수정하기" : "제출하기"} onPress={handleSubmit} disabled={!choice || !data || confirmed || history.isLoading || history.isError} loading={mutation.isPending} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 16
  },
  question: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28
  },
  subtitle: {
    color: "#667085",
    fontSize: 14,
    marginTop: -8
  },
  errorText: {
    color: "#B42318",
    fontSize: 12
  }
});
