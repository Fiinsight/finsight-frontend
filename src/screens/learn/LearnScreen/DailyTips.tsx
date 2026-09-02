import { StyleSheet, Text, View } from "react-native";

const tips = [
  "주가는 실적뿐 아니라 기대감으로도 움직입니다. 뉴스의 '기대'와 '확정된 사실'을 구분해보세요.",
  "하나의 뉴스만으로 투자를 결정하기보다 여러 지표를 함께 확인하는 습관을 들이세요.",
  "금리가 오르면 대출 부담이 커져 성장주에는 대체로 불리하게 작용합니다.",
  "환율 상승은 수출기업에는 유리하지만 수입 원자재 비용에는 부담이 될 수 있습니다.",
  "실적 발표에서는 숫자뿐 아니라 향후 가이던스(전망치)를 함께 확인하세요.",
  "단기 변동성에 일희일비하기보다 장기적인 산업 흐름을 함께 보는 것이 중요합니다.",
  "분산 투자는 하나의 예측이 틀렸을 때의 위험을 줄여줍니다.",
  "뉴스의 헤드라인만 보지 말고 본문에서 근거를 확인하는 습관을 들이세요."
];

const accentColors = ["#175CD3", "#12B76A"];

export function DailyTips() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const firstIndex = dayOfYear % tips.length;
  const secondIndex = (dayOfYear + 1) % tips.length;
  const todaysTips = [tips[firstIndex], tips[secondIndex]];

  return (
    <View style={styles.group}>
      <Text style={styles.sectionTitle}>오늘의 한 줄 팁</Text>
      {todaysTips.map((tip, index) => (
        <View key={index} style={[styles.card, { borderLeftColor: accentColors[index % accentColors.length] }]}>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800"
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 14
  },
  tipText: {
    color: "#344054",
    fontSize: 14,
    lineHeight: 21
  }
});
