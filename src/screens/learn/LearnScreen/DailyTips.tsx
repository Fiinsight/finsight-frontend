import { colors, radius, spacing, typography } from "../../../theme";
import { useState } from "react";
import { localDateKey } from "../../../lib/readingProgressModel";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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

const tipsByLevel: Record<LearningLevel, Record<LearningFocus, DailyTip[]>> = {
  beginner: tipsByFocus,
  normal: {
    news: [{ tip: "전년 대비와 전분기 대비를 구분하고 같은 기준으로 비교해보세요.", example: "매출 증가율은 같아도 계절성이 큰 업종은 비교 기간에 따라 의미가 달라요." }, { tip: "발표 수치와 이전 전망의 차이를 따로 적어보세요.", example: "이익 증가와 전망 하향이 함께 나오면 각각의 근거 문장을 찾아보세요." }],
    decision: [{ tip: "판단을 뒷받침하는 수치와 반대 수치를 하나씩 모아보세요.", example: "수주 증가와 원가 상승을 함께 보면 수익성 변화를 점검할 수 있어요." }, { tip: "예측의 조건과 확인할 날짜를 메모해보세요.", example: "환율이 유지된다는 조건과 다음 실적 발표일을 적어보세요." }],
    market: [{ tip: "시장 지수와 업종 수익률을 같은 기간으로 비교해보세요.", example: "지수보다 업종이 더 올랐다면 업종 공통 뉴스도 확인해보세요." }, { tip: "금리와 환율 변화가 비용에 전달되는 경로를 적어보세요.", example: "원화 약세가 매출에 주는 이익과 수입 원가 부담을 나눠보세요." }],
    reflection: [{ tip: "결과보다 당시 사용한 근거가 유효했는지 점검해보세요.", example: "방향을 맞혀도 근거로 적은 매출 전망이 실제로 바뀌었는지 확인해요." }, { tip: "같은 조건의 판단을 모아 반복되는 습관을 찾아보세요.", example: "실적 발표 기사에서 기대와 실제 수치를 구분했는지 비교해요." }]
  },
  analyst: {
    news: [{ tip: "기사의 수치가 공시 원문과 조정 기준까지 일치하는지 확인해보세요.", example: "연결·별도 재무제표와 일회성 손익을 구분해 비교해요." }, { tip: "공개 시점 이전의 시장 기대와 발표 수치의 차이를 분리해보세요.", example: "가이던스 수정 폭과 컨센서스 차이를 각각 기록해요." }],
    decision: [{ tip: "기본·낙관·비관 가정별로 판단이 바뀌는 조건을 적어보세요.", example: "물량과 단가를 나눠 어느 가정이 이익 추정에 더 민감한지 살펴봐요." }, { tip: "반대 가설을 기각할 수 있는 관측 지표를 정해보세요.", example: "수주가 매출로 전환되지 않는 가설을 다음 분기 잔고로 점검해요." }],
    market: [{ tip: "종목 수익률에서 시장·업종 공통 움직임을 구분해보세요.", example: "동일 기간 업종 흐름을 먼저 확인하고 개별 공시의 설명력을 살펴봐요." }, { tip: "뉴스 발생과 시장 반응의 시간 순서를 확인해보세요.", example: "장 마감 후 해설은 이전 움직임의 원인 근거로 사용하지 않아요." }],
    reflection: [{ tip: "확신 구간별 예측과 결과를 모아 과신 여부를 점검해보세요.", example: "표본이 적으면 적중률 차이를 능력 차이로 단정하지 않아요." }, { tip: "근거 변화와 외부 충격을 나눠 판단 과정을 복기해보세요.", example: "가정이 틀린 경우와 예상 밖 정책 발표가 발생한 경우를 구분해요." }]
  }
};

export function selectDailyTips(level: LearningLevel, pace: LearningPace, focus: LearningFocus, date = new Date()) {
  const tips = tipsByLevel[level][focus];
  const day = Math.floor(Date.parse(`${localDateKey(date)}T00:00:00Z`) / 86_400_000);
  return Array.from({ length: pace === "deep" ? 2 : 1 }, (_, index) => tips[(day + index) % tips.length]);
}
export function DailyTips({ level, pace, focus }: { level: LearningLevel; pace: LearningPace; focus: LearningFocus }) {
  const [requested, setRequested] = useState(false);
  const todaysTips = pace === "on-demand" && !requested ? [] : selectDailyTips(level, pace, focus);

  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{pace === "deep" ? "오늘의 깊이 읽기" : pace === "on-demand" ? "필요할 때 꺼내 보는 팁" : "오늘의 한 줄 팁"}</Text>
      {pace === "on-demand" && !requested ? <Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }} onPress={() => setRequested(true)}><Text style={styles.tipText}>필요한 팁 보기</Text></Pressable> : null}
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
  sectionTitle: { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },
  tipRow: { minHeight: 88, flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  mascot: { width: 58, height: 70 },
  speechBubble: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.card, padding: spacing.lg },
  tipLabel: { color: "#027A48", fontSize: typography.size.caption, fontWeight: typography.weight.bold, marginBottom: 5 },
  tipText: { color: colors.body, fontSize: typography.size.reading, lineHeight: typography.lineHeight.body },
  exampleText: { color: colors.muted, fontSize: typography.size.meta, lineHeight: typography.lineHeight.compact, marginTop: 5 }
});
