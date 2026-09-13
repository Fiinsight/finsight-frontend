import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { JudgementChoice, JudgementHistoryItem } from "../../../types/api";

const choiceLabel: Record<JudgementChoice, string> = {
  UP: "상승 예측",
  NEUTRAL: "중립 예측",
  DOWN: "하락 예측"
};

const choiceColor: Record<JudgementChoice, string> = {
  UP: "#12B76A",
  NEUTRAL: "#667085",
  DOWN: "#175CD3"
};

export function HistoryItem({ item, onPress }: { item: JudgementHistoryItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.title} numberOfLines={2}>
        {item.newsTitle}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.choice, { color: choiceColor[item.choice] }]}>{choiceLabel[item.choice]}</Text>
        {item.actualResult ? <Text style={styles.result}>실제 {item.actualResult}</Text> : null}
        {item.correct !== null ? (
          <View style={[styles.badge, { backgroundColor: item.correct ? "#ECFDF3" : "#FEF3F2" }]}>
            <Text style={[styles.badgeText, { color: item.correct ? "#12B76A" : "#D92D20" }]}>{item.correct ? "적중" : "불일치"}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.date}>{toRelativeTimeKorean(item.judgedAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    gap: 10
  },
  choice: {
    fontSize: 13,
    fontWeight: "700"
  },
  result: {
    color: "#475467",
    fontSize: 13
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
    color: "#98A2B3",
    fontSize: 12
  }
});
