import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { answerLearningQuestion, getNewsLesson } from "../../../lib/api";
import type { ReadingLevel } from "../../../types/api";
import { ArticleBody } from "./ArticleBody";

export function LearningPanel({ newsId, level, quizTerm, onTermPress, onReviewPress, onQuizLayout }: { newsId: number; level: ReadingLevel; quizTerm?: string; onTermPress: (term: string) => void; onReviewPress: () => void; onQuizLayout?: (y: number) => void }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const lesson = useQuery({ queryKey: ["news-lesson", newsId, level, quizTerm ?? null], queryFn: () => getNewsLesson(newsId, level, quizTerm), retry: 0, staleTime: 10 * 60_000 });
  const answer = useMutation({
    mutationFn: (index: number) => answerLearningQuestion(newsId, level, lesson.data!.question!.term, index),
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: ["learning-reviews"] });
      void client.invalidateQueries({ queryKey: ["learning-progress"] });
      void client.invalidateQueries({ queryKey: ["learning-recommendations"] });
      void client.invalidateQueries({ queryKey: ["daily-learning-terms"] });
      const animation = result.correct
        ? Animated.sequence([Animated.timing(scale, { toValue: 1.035, duration: 130, useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 130, useNativeDriver: true })])
        : Animated.sequence([6, -6, 5, -5, 0].map((value) => Animated.timing(shake, { toValue: value, duration: 65, useNativeDriver: true })));
      animation.start();
    }
  });
  if (lesson.isLoading) return <Text>내 수준에 맞는 설명을 불러오는 중이에요.</Text>;
  if (!lesson.data) return <View style={styles.card}><Text>수준별 설명을 확인할 수 없습니다. 원문 링크를 확인하세요.</Text><Pressable accessibilityRole="button" onPress={() => void lesson.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>;
  const data = lesson.data;
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>내 수준에 맞게 읽기</Text>
      <Text style={styles.muted}>{data.mode === "EXCERPT" ? "원문에서 핵심 문장을 골라 보여드려요" : data.mode === "REWRITTEN" ? ({ beginner: "핵심 사실을 쉬운 말로 읽어보세요.", normal: "핵심 사실과 비교 기준을 확인해보세요.", analyst: "기사의 근거·수치·리스크를 나눠 살펴보세요." })[level] : "수준별 설명을 확인할 수 없습니다."}</Text>
      <Text style={styles.guide}>{data.readingGuide}</Text>
      <ArticleBody text={data.summary.replace(/\s*\(fallback\)/gi, "")} terms={data.glossary.map((g) => g.term)} onTermPress={onTermPress} />
      <Text style={styles.heading}>알아둘 개념</Text>
      <Text style={styles.muted}>아래는 일반 용어 설명이며 기사에 추가된 사실이 아닙니다.</Text>
      {data.glossary.length ? data.glossary.map((g) => <View key={g.term}><Text style={styles.term}>{g.term}</Text><Text style={styles.body}>{g.definition}</Text></View>) : <Text>이 기사에서 학습할 용어를 확인할 수 없습니다.</Text>}
      {data.question ? <View style={styles.quiz} onLayout={event => onQuizLayout?.(event.nativeEvent.layout.y)}>
        <Text style={styles.heading}>오늘의 퀴즈</Text>
        <Text style={styles.body}>Q. {data.question.prompt}</Text>
        {data.question.options.map((option, index) => {
          const chosen = selected === index;
          const correct = !!answer.data && option === answer.data.definition;
          const wrong = !!answer.data && chosen && !answer.data.correct;
          return <Animated.View key={option} style={chosen ? { transform: [{ scale }, { translateX: shake }] } : undefined}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: answer.isPending || !!answer.data, selected: chosen }}
              disabled={answer.isPending || !!answer.data}
              style={[styles.option, correct && styles.correct, wrong && styles.wrong]}
              onPress={() => { setSelected(index); answer.mutate(index); }}>
              <Text style={[styles.body, correct && styles.correctText, wrong && styles.wrongText]}>{["①", "②", "③"][index]} {option}{correct ? " ✓" : wrong ? " ✕" : ""}</Text>
            </Pressable>
          </Animated.View>;
        })}
        {answer.isPending ? <Text>답변을 저장하는 중이에요.</Text> : null}
        {answer.isError ? <Text style={styles.muted}>답변을 저장하지 못했습니다. 다시 선택해 주세요.</Text> : null}
        {answer.data ? <View accessibilityLiveRegion="polite" style={styles.quiz}><Text style={styles.term}>{answer.data.correct ? "정답이에요!" : "아쉬워요"}</Text><Text style={styles.body}>{answer.data.termDefinition ?? answer.data.definition}</Text>
          {!answer.data.correct ? <>
            <Pressable accessibilityRole="button" accessibilityLabel={`${data.question.term} 다시 볼 개념을 학습 탭에서 보기`} onPress={onReviewPress}><Text style={styles.link}>{`'${data.question.term}'를 다시 볼 개념에 담았어요 · 학습 탭에서 보기 →`}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="틀린 퀴즈 다시 풀기" style={styles.option} onPress={() => { answer.reset(); setSelected(null); scale.setValue(1); shake.setValue(0); }}><Text style={styles.link}>다시 풀기</Text></Pressable>
          </> : null}
        </View> : null}
      </View> : <Text style={styles.muted}>이 기사는 퀴즈로 낼 개념이 없어요</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EAECF0", borderRadius: 8 },
  quiz: { gap: 14 },
  heading: { fontSize: 16, fontWeight: "700", color: "#101828" },
  muted: { fontSize: 12, lineHeight: 19, color: "#667085" },
  body: { fontSize: 14, lineHeight: 22, color: "#344054" },
  term: { fontSize: 14, lineHeight: 22, fontWeight: "700", color: "#175CD3" },
  guide: { fontSize: 13, lineHeight: 20, color: "#475467" },
  option: { borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, padding: 12 },
  correct: { backgroundColor: "#DCFCE7", borderColor: "#15803D" },
  wrong: { backgroundColor: "#FEE2E2", borderColor: "#B91C1C" },
  correctText: { color: "#166534" },
  wrongText: { color: "#991B1B" },
  link: { color: "#175CD3", fontSize: 14, lineHeight: 22, fontWeight: "700" }
});
