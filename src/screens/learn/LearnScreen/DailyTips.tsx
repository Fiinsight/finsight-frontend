import { Image, StyleSheet, Text, View } from "react-native";
import type { LearningFocus, LearningLevel, LearningPace } from "../../../lib/learningPreferences";

type DailyTip = { tip: string; example: string };

const tipsByFocus: Record<LearningFocus, DailyTip[]> = {
  news: [
    { tip: "헤드라인의 전망과 기사에서 확인된 사실을 나눠 읽어보세요.", example: "예: ‘실적 개선 전망’은 전망이고, 본문에 적힌 영업이익 증가는 확인된 사실이에요." },
    { tip: "본문에서 변화한 숫자와 그 숫자의 기준 기간을 찾아보세요.", example: "예: 매출이 10% 늘었다면 지난해 같은 기간보다 늘었는지 확인해보세요." },
    { tip: "모르는 용어를 하나 골라 기사 속 문장으로 뜻을 추측해보세요.", example: "예: ‘가이던스 하향’ 뒤에 나온 실적 전망 숫자를 보면 뜻을 짐작할 수 있어요." },
    { tip: "기사의 주체와 영향을 받는 사람·기업을 한 문장으로 정리해보세요.", example: "예: 금리 인상은 돈을 빌리는 기업의 이자 부담을 키울 수 있어요." }
  ],
  decision: [
    { tip: "투자 의견을 정하기 전에 그 의견을 뒤집을 근거도 하나 찾아보세요.", example: "예: 호재 기사라도 원재료 가격 상승이나 이미 오른 주가가 반대 근거가 될 수 있어요." },
    { tip: "실적 숫자를 시장 기대와 비교하고, 전망 변화도 확인해보세요.", example: "예: 이익이 늘었어도 시장 예상보다 작으면 주가가 내릴 수 있어요." },
    { tip: "기사의 사실·해석·예측을 나누면 판단 근거가 더 선명해져요.", example: "예: ‘매출이 늘었다’는 사실, ‘주가가 오를 것’은 예측이에요." },
    { tip: "한 뉴스만으로 결론 내리지 말고 반대 관점의 지표도 살펴보세요.", example: "예: 수출이 늘었다면 환율과 비용도 함께 확인해 기업 이익이 실제로 늘지 보세요." }
  ],
  market: [
    { tip: "금리 변화가 업종별 비용과 미래 이익에 미치는 영향을 비교해보세요.", example: "예: 금리가 오르면 은행에는 이자 수익 기회가, 빚이 많은 기업에는 부담이 될 수 있어요." },
    { tip: "환율은 수출기업과 수입기업에 서로 다른 방향으로 작용할 수 있어요.", example: "예: 원화 약세는 해외 매출이 큰 기업에는 유리하지만 수입 비용은 키울 수 있어요." },
    { tip: "시장 지수와 개별 종목이 다르게 움직인 이유를 찾아보세요.", example: "예: 코스피가 내려도 실적이 좋은 한 종목은 오를 수 있어요." },
    { tip: "단기 뉴스와 장기 산업 흐름을 구분해서 바라보세요.", example: "예: 하루 급등은 뉴스일 수 있지만, 몇 달 흐름은 수요와 실적을 더 많이 반영해요." }
  ],
  reflection: [
    { tip: "예전에 남긴 메모를 다시 읽고 지금도 같은 생각인지 확인해보세요.", example: "예: ‘금리 때문에 하락’이라고 적었다면 다음날 실제 금리와 주가를 비교해보세요." },
    { tip: "메모한 판단의 근거와 실제로 일어난 일을 나란히 비교해보세요.", example: "예: 예상한 방향과 실제 방향이 달랐다면 어떤 숫자를 놓쳤는지 찾아보세요." },
    { tip: "틀린 예측도 이유를 기록하면 다음 판단에 쓸 수 있는 자료가 돼요.", example: "예: 뉴스의 발표 시점과 주가 반응 시점을 따로 적으면 판단이 더 정확해져요." },
    { tip: "기사 메모에 확신 정도를 덧붙이면 생각의 변화를 돌아보기 쉬워요.", example: "예: ‘확신 60%’처럼 적으면 나중에 과한 확신이었는지 확인할 수 있어요." }
  ]
};

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
        <View key={index} style={styles.tipRow}>
          <Image source={require("../../../../assets/finsight-mascot-face.png")} style={styles.mascot} resizeMode="contain" />
          <View style={styles.speechBubble}>
            <Text style={styles.tipLabel}>수달이의 한마디</Text>
            <Text style={styles.tipText}>{tip.tip}</Text>
            <Text style={styles.exampleText}>{tip.example}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  sectionTitle: { color: "#101828", fontSize: 16, fontWeight: "800" },
  tipRow: { minHeight: 88, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  mascot: { width: 58, height: 70 },
  speechBubble: { flex: 1, backgroundColor: "#FFFFFF", borderColor: "#D9EEE2", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  tipLabel: { color: "#12B76A", fontSize: 12, fontWeight: "800", marginBottom: 5 },
  tipText: { color: "#344054", fontSize: 14, lineHeight: 21 },
  exampleText: { color: "#667085", fontSize: 12, lineHeight: 18, marginTop: 5 }
});
