import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../lib/format";
import type { NewsBrief } from "../types/api";

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
        <Text style={styles.symbol}>{news.category}</Text>
        <Text style={styles.date}>{news.publishedAt ? toRelativeTimeKorean(news.publishedAt) : "발행시간 확인할 수 없음"}</Text>
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
      <Text style={styles.summary} numberOfLines={2}>{news.summary}</Text>
      <Text style={styles.reason} numberOfLines={2}>투자 포인트: {news.importanceReason}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  date: { color: "#667085", fontSize: 12 },
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
