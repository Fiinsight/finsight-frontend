import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { ChartRelatedNews } from "../../../types/api";

interface RelatedNewsListProps {
  items: ChartRelatedNews[];
  onPress: (item: ChartRelatedNews) => void;
}

export function RelatedNewsList({ items, onPress }: RelatedNewsListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.title}>관련 뉴스</Text>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.row} activeOpacity={0.75} onPress={() => onPress(item)}>
          <Text style={styles.headline} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta}>
            {item.source} · {toRelativeTimeKorean(item.publishedAt)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10
  },
  title: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800"
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    paddingTop: 10,
    gap: 4
  },
  headline: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  },
  meta: {
    color: "#98A2B3",
    fontSize: 12
  }
});
