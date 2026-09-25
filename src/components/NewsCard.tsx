import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NewsBrief } from "../types/api";

// Intentionally not "상승/중립/하락" — that's the exact wording used on the
// Judgement screen for the user's own UP/NEUTRAL/DOWN vote, and reusing it
// here (for the AI's own sentiment read on the article, unrelated to any
// user vote) reads as if the user had already voted.
const sentimentLabel: Record<NewsBrief["sentimentHint"], string> = {
  POSITIVE: "긍정적",
  NEUTRAL: "중립적",
  NEGATIVE: "부정적"
};

const sentimentStyle = StyleSheet.create({
  POSITIVE: { color: "#D92D20", backgroundColor: "#FEE4E2" },
  NEUTRAL: { color: "#475467", backgroundColor: "#F2F4F7" },
  NEGATIVE: { color: "#175CD3", backgroundColor: "#D1E9FF" }
});

interface NewsCardProps {
  news: NewsBrief;
  onPress: () => void;
}

export function NewsCard({ news, onPress }: NewsCardProps) {
  return (
    <TouchableOpacity
      style={styles.newsCard}
      activeOpacity={0.85}
      onPress={() => {
        if (Platform.OS === "web" && typeof document !== "undefined") {
          (document.activeElement as HTMLElement | null)?.blur();
        }
        onPress();
      }}
    >
      <View style={styles.cardTop}>
        <Text style={styles.symbol}>{news.relatedSymbol}</Text>
        <Text style={[styles.sentiment, sentimentStyle[news.sentimentHint]]}>{sentimentLabel[news.sentimentHint]}</Text>
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
      <Text style={styles.summary} numberOfLines={2}>{news.summary}</Text>
      <Text style={styles.reason} numberOfLines={1}>왜 중요한가: {news.importanceReason}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  newsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  symbol: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "800"
  },
  sentiment: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  newsTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25
  },
  summary: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 21
  },
  reason: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});
