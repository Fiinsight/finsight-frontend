import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { NewsCard } from "../../../components/NewsCard";
import { getTodayBriefing } from "../../../lib/api";
import { sampleNews } from "../../../lib/sampleData";

interface NewsSectionProps {
  onSelectNews: (newsId: number) => void;
}

export function NewsSection({ onSelectNews }: NewsSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: getTodayBriefing,
    retry: 0
  });

  const news = data ?? sampleNews;

  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 핵심 뉴스</Text>
        <Text style={styles.muted}>{isLoading ? "불러오는 중" : `${news.length}개 선별`}</Text>
      </View>

      {news.map((item) => (
        <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 16
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "700"
  },
  muted: {
    color: "#98A2B3",
    fontSize: 13
  }
});
