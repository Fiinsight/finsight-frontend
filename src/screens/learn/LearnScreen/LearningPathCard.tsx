import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LearningPreferences } from "../../../lib/learningPreferences";

const pathCopy = {
  news: { title: "뉴스를 이해하는 학습 루트", body: "핵심 사실과 금융 용어를 먼저 익혀요." },
  decision: { title: "판단 근거를 만드는 학습 루트", body: "뉴스와 실적을 연결해 판단 기준을 세워요." },
  market: { title: "시장 흐름을 읽는 학습 루트", body: "금리·환율·업종 흐름을 뉴스와 함께 살펴봐요." },
  reflection: { title: "기록을 다시 읽는 학습 루트", body: "기사에 남긴 메모를 다시 보고 내 생각을 다듬어요." }
} as const;

const levelLabels = { beginner: "기초부터", normal: "핵심 중심", analyst: "맥락까지 깊게" } as const;
const paceLabels = { micro: "짧게 매일", deep: "깊이 있게", "on-demand": "궁금할 때" } as const;

export function LearningPathCard({ preferences, onOpenHistory }: {
  preferences: LearningPreferences;
  onOpenHistory: () => void;
}) {
  const copy = pathCopy[preferences.focus];
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>온보딩 답변으로 고른 나의 루트</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      <View style={styles.tags}>
        <Text style={styles.tag}>{levelLabels[preferences.level]}</Text>
        <Text style={styles.tag}>{paceLabels[preferences.pace]}</Text>
      </View>
      <Text style={styles.goalLabel}>이번 목표</Text>
      <Text style={styles.goal}>{preferences.dailyGoal}</Text>
      {preferences.focus === "reflection" ? (
        <Pressable accessibilityRole="button" onPress={onOpenHistory} style={styles.action}>
          <Text style={styles.actionText}>내 기사 메모 복습하기 →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#EAF2FF", borderRadius: 16, padding: 18, gap: 7 },
  eyebrow: { color: "#175CD3", fontSize: 11, fontWeight: "800" },
  title: { color: "#102A63", fontSize: 17, fontWeight: "800" },
  body: { color: "#475467", fontSize: 13, lineHeight: 19 },
  tags: { flexDirection: "row", gap: 7, marginTop: 3 },
  tag: { overflow: "hidden", color: "#175CD3", backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: "700" },
  goalLabel: { color: "#667085", fontSize: 11, fontWeight: "700", marginTop: 3 },
  goal: { color: "#101828", fontSize: 13, fontWeight: "700" },
  action: { alignSelf: "flex-start", paddingTop: 5 },
  actionText: { color: "#175CD3", fontSize: 13, fontWeight: "800" }
});
