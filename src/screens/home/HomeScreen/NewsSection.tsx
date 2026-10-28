import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NewsCard } from "../../../components/NewsCard";
import { getTodayBriefing } from "../../../lib/api";
import type { NewsBrief } from "../../../types/api";
import { selectHomeNews } from "../../../lib/watchlist";

interface NewsSectionProps {
  onSelectNews: (newsId: number) => void;
  watchedNews?: NewsBrief[];
}

export function NewsSection({ onSelectNews, watchedNews = [] }: NewsSectionProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: getTodayBriefing,
    retry: 0,
    staleTime: 60_000
  });
  const news = selectHomeNews(data ?? [], watchedNews);

  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 핵심 뉴스</Text>
        {isLoading ? <Text style={styles.muted}>불러오는 중</Text> : null}
      </View>
      {news.map(item => <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />)}
      {isError ? <Pressable accessibilityRole="button" onPress={() => void refetch()} style={styles.moreButton}><Text style={styles.moreButtonText}>뉴스 다시 시도</Text></Pressable> : null}
      {!news.length && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{isError ? "뉴스를 불러오지 못했어요" : "오늘의 뉴스를 준비하고 있어요"}</Text>
          <Text style={styles.emptyBody}>{isError ? "연결을 확인하고 다시 시도해 주세요." : "잠시 후 실제 수집된 뉴스가 이곳에 표시됩니다."}</Text>
        </View>
      ) : null}
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
    color: "#667085",
    fontSize: 13
  },
  emptyState: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center"
  },
  emptyTitle: {
    color: "#182B59",
    fontSize: 16,
    fontWeight: "800"
  },
  emptyBody: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center"
  },
  moreButton: {
    alignItems: "center",
    borderColor: "#D0D5DD",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  moreButtonText: {
    color: "#175CD3",
    fontSize: 14,
    fontWeight: "700"
  }
});
