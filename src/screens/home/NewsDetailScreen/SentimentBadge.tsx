import { StyleSheet, Text, View } from "react-native";
import type { Sentiment } from "../../../types/api";

const label: Record<Sentiment, string> = {
  POSITIVE: "긍정적 영향 예상",
  NEUTRAL: "중립적 영향 예상",
  NEGATIVE: "부정적 영향 예상"
};

const tone: Record<Sentiment, { color: string; backgroundColor: string }> = {
  POSITIVE: { color: "#D92D20", backgroundColor: "#FEE4E2" },
  NEUTRAL: { color: "#475467", backgroundColor: "#F2F4F7" },
  NEGATIVE: { color: "#175CD3", backgroundColor: "#D1E9FF" }
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone[sentiment].backgroundColor }]}>
      <Text style={[styles.text, { color: tone[sentiment].color }]}>{label[sentiment]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  text: {
    fontSize: 13,
    fontWeight: "800"
  }
});
