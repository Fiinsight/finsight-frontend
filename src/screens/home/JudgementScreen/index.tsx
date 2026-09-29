import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { ScreenTopBar } from "../../../components/ScreenTopBar";
import { getNewsDetail, submitJudgement } from "../../../lib/api";
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

  const { data, isError, isLoading } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0,
    staleTime: 60_000
  });

  const symbolLabel = data?.relatedSymbolName || data?.relatedSymbol || "관련 종목";

  const mutation = useMutation({
    mutationFn: () => submitJudgement({ newsId, choice: choice as JudgementChoice, reason: reason || undefined })
  });

  const handleSubmit = async () => {
    if (!choice) {
      return;
    }
    setSubmitError(false);
    try {
      const ack = await mutation.mutateAsync();
      clearJudgementDraft(newsId);
      navigation.navigate("Feedback", { newsId, ack });
    } catch {
      // Real market/AI feedback can't exist yet at submit time either way —
      // but if the submission itself failed, the judgement was never saved,
      // so showing a "success" screen here would be actively misleading.
      // Let the user retry instead.
      setSubmitError(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTopBar title="판단하기" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.question}>{`이 뉴스가 내일 ${symbolLabel} 주가에 미칠 영향은?`}</Text>
          <Text style={styles.subtitle}>뉴스 내용을 바탕으로 주가 방향을 예측해보세요</Text>

          {isLoading ? <Text style={styles.errorText}>뉴스를 불러오는 중이에요.</Text> : null}
          {isError || !data ? <Text style={styles.errorText}>실제 뉴스를 확인할 수 없어 판단을 저장할 수 없어요. 이전 화면에서 다시 시도해주세요.</Text> : null}
          {data ? <NewsSummaryCard summary={data.summary} /> : null}
          {data ? <DirectionChoices value={choice} onChange={(next) => setJudgementChoice(newsId, next)} /> : null}
          {data ? <ReasonInput value={reason} onChange={(text) => setJudgementReason(newsId, text)} /> : null}

          {submitError ? <Text style={styles.errorText}>서버에 연결하지 못해 판단이 저장되지 않았어요. 다시 시도해주세요.</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar label="제출하기" onPress={handleSubmit} disabled={!choice || !data} loading={mutation.isPending} />
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
