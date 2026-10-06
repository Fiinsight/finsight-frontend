import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { answerLearningQuestion, getNewsLesson } from "../../../lib/api";
import type { ReadingLevel } from "../../../types/api";
import { ArticleBody } from "./ArticleBody";

export function LearningPanel({ newsId, level, onTermPress }: { newsId: number; level: ReadingLevel; onTermPress: (term: string) => void }) {
  const client = useQueryClient();
  const lesson = useQuery({ queryKey: ["news-lesson", newsId, level], queryFn: () => getNewsLesson(newsId, level), retry: 0, staleTime: 10 * 60_000 });
  const answer = useMutation({
    mutationFn: (index: number) => answerLearningQuestion(newsId, level, lesson.data!.question!.term, index),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["learning-reviews"] }); }
  });
  if (lesson.isLoading) return <Text>내 수준에 맞는 설명을 불러오는 중이에요.</Text>;
  if (!lesson.data) return <View style={styles.card}><Text>수준별 설명을 확인할 수 없습니다. 원문 링크를 확인하세요.</Text><Pressable accessibilityRole="button" onPress={() => void lesson.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>;
  const data = lesson.data;
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>내 수준에 맞게 읽기</Text>
      <Text style={styles.muted}>{data.mode === "RULE_FALLBACK" ? "기사의 핵심 내용을 쉽게 풀어 읽어보세요." : "수준별 설명을 확인할 수 없습니다."}</Text>
      <Text style={styles.guide}>{data.readingGuide}</Text>
      <ArticleBody text={data.summary.replace(/\s*\(fallback\)/gi, "")} terms={data.glossary.map((g) => g.term)} onTermPress={onTermPress} />
      <Text style={styles.heading}>알아둘 개념</Text>
      <Text style={styles.muted}>아래는 일반 용어 설명이며 기사에 추가된 사실이 아닙니다.</Text>
      {data.glossary.length ? data.glossary.map((g) => <View key={g.term}><Text style={styles.term}>{g.term}</Text><Text style={styles.body}>{g.definition}</Text></View>) : <Text>이 기사에서 학습할 용어를 확인할 수 없습니다.</Text>}
      {data.question ? <>
        <Text style={styles.heading}>이해 확인</Text>
        <Text style={styles.body}>{data.question.prompt}</Text>
        {data.question.options.map((option, index) => <Pressable key={option} accessibilityRole="button" disabled={answer.isPending} style={styles.option} onPress={() => answer.mutate(index)}><Text style={styles.body}>{index + 1}. {option}</Text></Pressable>)}
        {answer.isPending ? <Text>답변을 저장하는 중이에요.</Text> : null}
        {answer.isError ? <Text style={styles.muted}>답변을 저장하지 못했습니다. 다시 선택해 주세요.</Text> : null}
        {answer.data ? <View accessibilityLiveRegion="polite"><Text style={styles.term}>{answer.data.correct ? "정답이에요" : "다시 살펴볼까요?"}</Text><Text style={styles.body}>{answer.data.definition}</Text><Text style={styles.muted}>{answer.data.message}</Text></View> : null}
      </> : <Text style={styles.muted}>이 기사에는 준비된 이해 확인 문항이 없습니다.</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EAECF0", borderRadius: 8 },
  heading: { fontSize: 16, fontWeight: "700", color: "#101828" },
  muted: { fontSize: 12, lineHeight: 19, color: "#667085" },
  body: { fontSize: 14, lineHeight: 22, color: "#344054" },
  term: { fontSize: 14, lineHeight: 22, fontWeight: "700", color: "#175CD3" },
  guide: { fontSize: 13, lineHeight: 20, color: "#475467" },
  option: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, padding: 12 },
  link: { color: "#175CD3", fontWeight: "700" }
});
