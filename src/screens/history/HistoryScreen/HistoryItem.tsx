import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { judgementResult, feedbackVerdict } from "../../../lib/historyRecords";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { JudgementChoice, JudgementHistoryItem } from "../../../types/api";

const choiceLabel: Record<JudgementChoice, string> = {
  UP: "상승 예측",
  NEUTRAL: "중립 예측",
  DOWN: "하락 예측"
};

const choiceColor: Record<JudgementChoice, string> = {
  UP: "#027A48",
  NEUTRAL: "#667085",
  DOWN: "#175CD3"
};

export function HistoryItem({ item, onPress, unread = false }: { item: JudgementHistoryItem; onPress: () => void; unread?: boolean }) {
  const result = judgementResult(item);
  const partial = feedbackVerdict(item) === "PARTIAL";
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {unread ? <Text style={styles.arrived} accessibilityLabel="새 판단 결과 도착">결과 도착</Text> : null}
      <Text style={styles.title} numberOfLines={2}>
        {item.newsTitle}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.choice, { color: choiceColor[item.choice] }]}>내 예측: {choiceLabel[item.choice]}</Text>
        <Text style={result.pending ? styles.pending : styles.result}>{result.label}</Text>
        {result.correct !== null ? (
          <View style={[styles.badge, { backgroundColor: partial ? "#F2F4F7" : result.correct ? "#ECFDF3" : "#FEF3F2" }]}>
            <Text style={[styles.badgeText, { color: partial ? "#667085" : result.correct ? "#027A48" : "#D92D20" }]}>{partial ? "방향 같음·소폭 변동" : result.correct ? "맞음" : "틀림"}</Text>
          </View>
        ) : null}
      </View>
      {result.feedbackText ? <Text style={styles.feedback}>{result.feedbackText}</Text> : null}
      <Text style={styles.date}>{toRelativeTimeKorean(item.judgedAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  arrived: { color: "#175CD3", backgroundColor: "#EEF4FF", alignSelf: "flex-start", fontSize: 12, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8
  },
  title: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  choice: {
    fontSize: 13,
    fontWeight: "700"
  },
  result: {
    color: "#475467",
    fontSize: 13
  },
  pending: {
    color: "#667085",
    fontSize: 13
  },
  feedback: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    color: "#344054",
    fontSize: 13,
    lineHeight: 20,
    padding: 10
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800"
  },
  date: {
    color: "#667085",
    fontSize: 12
  }
});
