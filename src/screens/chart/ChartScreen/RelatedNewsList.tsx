import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../../../lib/format";
import type { ChartRelatedNews } from "../../../types/api";

interface RelatedNewsListProps {
  items: ChartRelatedNews[];
  expandMarket?: boolean;
  onPress: (item: ChartRelatedNews) => void;
}

export function RelatedNewsList({ items, onPress, expandMarket = false }: RelatedNewsListProps) {
  const [count, setCount] = useState(10);
  const [marketOpen, setMarketOpen] = useState(expandMarket);
  const direct = items.filter((item) => item.relationType !== "MARKET" && item.relationType !== "REFERENCE");
  const references = items.filter(item => item.relationType === "REFERENCE");
  const market = items.filter((item) => item.relationType === "MARKET");
  const rows = (news: ChartRelatedNews[]) => news.slice(0, count).map((item, index) => (
    <TouchableOpacity accessibilityRole="button" key={`${item.id}-${index}`} style={styles.row} activeOpacity={0.75} onPress={() => onPress(item)}>
      <Text style={styles.headline} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.meta}>{item.source} · {toRelativeTimeKorean(item.publishedAt)}</Text>
    </TouchableOpacity>
  ));
  return <View style={styles.group}>
    <Text style={styles.title}>관련 뉴스</Text>
    {items.length === 0 ? <Text style={styles.meta}>이 시점에 수집된 관련 뉴스가 없어요</Text> : null}
    {rows(direct)}
    {market.length ? <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded: marketOpen}} onPress={() => setMarketOpen(!marketOpen)}><Text style={styles.title}>{`시장 뉴스 ${market.length}건 ${marketOpen ? "접기" : "펼치기"}`}</Text></TouchableOpacity> : null}
    {marketOpen ? rows(market) : null}
    {references.length ? <View style={styles.group}>
      <Text style={styles.title}>장 마감 후 참고 기사</Text>
      <Text style={styles.meta}>움직임 이후에 나온 기사예요. 원인 후보와 구분해서 읽어주세요.</Text>
      {rows(references)}
    </View> : null}
    {direct.length > count || references.length > count || (marketOpen && market.length > count) ? <TouchableOpacity accessibilityRole="button" onPress={() => setCount(count + 10)}><Text style={styles.link}>뉴스 더 보기</Text></TouchableOpacity> : null}
  </View>;
}

const styles = StyleSheet.create({
  link: { color: "#175CD3", fontSize: 14, fontWeight: "600", paddingVertical: 8 },
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
