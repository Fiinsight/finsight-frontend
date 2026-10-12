import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MoveInsight } from "../../../types/api";
const relations = { DIRECT: "직접 관련 뉴스", MARKET: "시장 전체 영향", NONE: "관련 뉴스 없음" };
interface Props {
  insight: MoveInsight;
  period: string;
  onNewsPress: (id: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}
export function ChartDocentPanel({ insight, period, onNewsPress, onPrevious, onNext, hasPrevious, hasNext }: Props) {
  const docent = insight.docent;
  const date = period === "MINUTE" ? insight.timestamp.replace("T", " ").slice(0, 16) : `${insight.timestamp.slice(0, 10)}${period === "W" ? " 주간" : ""}`;
  const relation = docent?.relation ?? (insight.newsId != null ? (insight.candidateNews[0]?.relationType === "MARKET" ? "MARKET" : "DIRECT") : "NONE");
  return <View style={styles.panel} accessibilityLabel="선택한 급등락 지점의 차트 도슨트">
    <View style={styles.header}>
      <Text style={styles.date}>{date}</Text>
      <Text style={[styles.change, { color: insight.changePercent >= 0 ? "#D92D20" : "#175CD3" }]}>{insight.changePercent > 0 ? "+" : ""}{insight.changePercent.toFixed(2)}%</Text>
    </View>
    <Text style={styles.badge}>{relations[relation]}</Text>
    <View style={styles.block}><Text style={styles.label}>무슨 일이 있었나요?</Text><Text style={styles.body}>{docent?.whatHappened || "이 지점의 뉴스 설명을 확인할 수 없어요."}</Text></View>
    <View style={styles.highlightBox}><Text style={styles.label}>왜 주가가 움직였을까요?</Text><Text style={styles.body}>{docent?.possibleReason || insight.explanation || "수급이나 시장 전체 요인이 영향을 줬을 수 있어요."}</Text></View>
    <View style={styles.block}><Text style={styles.label}>시장 영향</Text><Text style={styles.body}>{docent?.marketImpact || "매수·매도 수급과 시장 흐름도 함께 확인해야 해요."}</Text></View>
    {docent?.newsId != null ? <TouchableOpacity accessibilityRole="link" accessibilityLabel={`${docent.newsTitle} 기사 상세 보기`} onPress={() => onNewsPress(docent.newsId!)}><Text style={styles.news}>{docent.newsTitle}</Text><Text style={styles.caption}>{docent.source}</Text></TouchableOpacity> : null}
    <Text style={styles.caption}>뉴스와 주가가 같은 시점에 움직였다는 뜻이며, 확정된 원인은 아니에요.</Text>
    <View style={styles.navigation}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="이전 급등락" accessibilityState={{ disabled: !hasPrevious }} disabled={!hasPrevious} onPress={onPrevious} style={[styles.button, !hasPrevious && styles.disabled]}><Text style={styles.buttonText}>◀ 이전 급등락</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="다음 급등락" accessibilityState={{ disabled: !hasNext }} disabled={!hasNext} onPress={onNext} style={[styles.button, !hasNext && styles.disabled]}><Text style={styles.buttonText}>다음 급등락 ▶</Text></TouchableOpacity>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: "#FFFAEB", borderColor: "#FEDF89", borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  date: { fontSize: 13, color: "#667085" },
  change: { fontSize: 24, fontWeight: "800" },
  badge: { alignSelf: "flex-start", color: "#B54708", fontSize: 12, fontWeight: "700" },
  block: { gap: 5 },
  label: { color: "#101828", fontSize: 15, fontWeight: "700" },
  body: { color: "#475467", fontSize: 15, lineHeight: 22 },
  highlightBox: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 5 },
  caption: { color: "#667085", fontSize: 12, lineHeight: 18 },
  news: { color: "#175CD3", fontSize: 14, lineHeight: 20, textDecorationLine: "underline" },
  navigation: { flexDirection: "row", gap: 8 },
  button: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8 },
  buttonText: { color: "#175CD3", fontSize: 12, fontWeight: "700" },
  disabled: { opacity: 0.4 }
});
