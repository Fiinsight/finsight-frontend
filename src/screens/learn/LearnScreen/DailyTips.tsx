import { StyleSheet, Text, View } from "react-native";
import type { LearningFocus, LearningLevel, LearningPace } from "../../../lib/learningPreferences";

const tipsByFocus: Record<LearningFocus, string[]> = {
  news: [
    "헤드라인의 전망과 기사에서 확인된 사실을 나눠 읽어보세요.",
    "본문에서 변화한 숫자와 그 숫자의 기준 기간을 찾아보세요.",
    "모르는 용어를 하나 골라 기사 속 문장으로 뜻을 추측해보세요.",
    "기사의 주체와 영향을 받는 사람·기업을 한 문장으로 정리해보세요."
  ],
  decision: [
    "투자 의견을 정하기 전에 그 의견을 뒤집을 근거도 하나 찾아보세요.",
    "실적 숫자를 시장 기대와 비교하고, 전망 변화도 확인해보세요.",
    "기사의 사실·해석·예측을 나누면 판단 근거가 더 선명해져요.",
    "한 뉴스만으로 결론 내리지 말고 반대 관점의 지표도 살펴보세요."
  ],
  market: [
    "금리 변화가 업종별 비용과 미래 이익에 미치는 영향을 비교해보세요.",
    "환율은 수출기업과 수입기업에 서로 다른 방향으로 작용할 수 있어요.",
    "시장 지수와 개별 종목이 다르게 움직인 이유를 찾아보세요.",
    "단기 뉴스와 장기 산업 흐름을 구분해서 바라보세요."
  ],
  reflection: [
    "예전에 남긴 메모를 다시 읽고 지금도 같은 생각인지 확인해보세요.",
    "메모한 판단의 근거와 실제로 일어난 일을 나란히 비교해보세요.",
    "틀린 예측도 이유를 기록하면 다음 판단에 쓸 수 있는 자료가 돼요.",
    "기사 메모에 확신 정도를 덧붙이면 생각의 변화를 돌아보기 쉬워요."
  ]
};

const accentColors = ["#175CD3", "#12B76A"];

export function DailyTips({ level, pace, focus }: { level: LearningLevel; pace: LearningPace; focus: LearningFocus }) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const tips = tipsByFocus[focus];
  const levelOffset = level === "analyst" ? 2 : level === "normal" ? 1 : 0;
  const firstIndex = (dayOfYear + levelOffset) % tips.length;
  const count = pace === "deep" ? 2 : 1;
  const todaysTips = Array.from({ length: count }, (_, index) => tips[(firstIndex + index) % tips.length]);

  return (
    <View style={styles.group}>
      <Text style={styles.sectionTitle}>{pace === "deep" ? "오늘의 깊이 읽기" : "오늘의 한 줄 팁"}</Text>
      {todaysTips.map((tip, index) => (
        <View key={index} style={[styles.card, { borderLeftColor: accentColors[index % accentColors.length] }]}>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  sectionTitle: { color: "#101828", fontSize: 16, fontWeight: "800" },
  card: { backgroundColor: "#FFFFFF", borderColor: "#EAECF0", borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 14 },
  tipText: { color: "#344054", fontSize: 14, lineHeight: 21 }
});
