import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { ScreenTopBar } from "../../../components/ScreenTopBar";
import { getNewsDetail, submitJudgement } from "../../../lib/api";
import { getSampleJudgementFeedback, getSampleNewsDetail } from "../../../lib/sampleData";
import type { NewsFlowParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import type { JudgementChoice } from "../../../types/api";
import { DirectionChoices } from "./DirectionChoices";
import { NewsSummaryCard } from "./NewsSummaryCard";
import { ReasonInput } from "./ReasonInput";

type Props = NativeStackScreenProps<NewsFlowParamList, "Judgement">;

export function JudgementScreen({ route, navigation }: Props) {
  const { newsId } = route.params;
  const choice = useAppStore((state) => state.judgementDraftByNewsId[newsId]?.choice);
  const reason = useAppStore((state) => state.judgementDraftByNewsId[newsId]?.reason ?? "");
  const setJudgementChoice = useAppStore((state) => state.setJudgementChoice);
  const setJudgementReason = useAppStore((state) => state.setJudgementReason);
  const clearJudgementDraft = useAppStore((state) => state.clearJudgementDraft);
  const [submitError, setSubmitError] = useState(false);

  const { data } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0
  });

  const detail = data ?? getSampleNewsDetail(newsId);
  const symbolLabel = detail.relatedSymbolName || detail.relatedSymbol || "관련 종목";

  const mutation = useMutation({
    mutationFn: () => submitJudgement({ newsId, choice: choice as JudgementChoice, reason: reason || undefined })
  });

  const handleSubmit = async () => {
    if (!choice) {
      return;
    }
    setSubmitError(false);
    let feedback;
    try {
      feedback = await mutation.mutateAsync();
    } catch {
      setSubmitError(true);
      feedback = getSampleJudgementFeedback(newsId, choice, reason);
    }
    clearJudgementDraft(newsId);
    navigation.navigate("Feedback", { newsId, feedback });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTopBar title="판단하기" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.question}>{`이 뉴스가 내일 ${symbolLabel} 주가에 미칠 영향은?`}</Text>
          <Text style={styles.subtitle}>뉴스 내용을 바탕으로 주가 방향을 예측해보세요</Text>

          <NewsSummaryCard summary={detail.summary} />
          <DirectionChoices value={choice} onChange={(next) => setJudgementChoice(newsId, next)} />
          <ReasonInput value={reason} onChange={(text) => setJudgementReason(newsId, text)} />

          {submitError ? <Text style={styles.errorText}>서버에 연결하지 못해 임시 결과로 보여드려요.</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar label="제출하기" onPress={handleSubmit} disabled={!choice} loading={mutation.isPending} />
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
    paddingBottom: 40,
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
