import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NewsCard } from "../../../components/NewsCard";
import { getMoreBriefing, getTodayBriefing } from "../../../lib/api";
import { sampleNews } from "../../../lib/sampleData";
import type { NewsBrief } from "../../../types/api";

interface NewsSectionProps {
  onSelectNews: (newsId: number) => void;
}

export function NewsSection({ onSelectNews }: NewsSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: getTodayBriefing,
    retry: 0
  });

  const [olderNews, setOlderNews] = useState<NewsBrief[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const news = data ?? sampleNews;
  // "더보기"는 백엔드에 실제로 연결됐을 때만 의미가 있음 — 샘플 폴백은
  // 항상 똑같은 3건 고정이라 더 불러올 게 없음.
  const isRealData = !!data;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const more = await getMoreBriefing(nextPage);
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setOlderNews((prev) => [...prev, ...more]);
        setNextPage((p) => p + 1);
        if (more.length < 10) {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 핵심 뉴스</Text>
        <Text style={styles.muted}>{isLoading ? "불러오는 중" : `${news.length}개 선별`}</Text>
      </View>

      {news.map((item) => (
        <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />
      ))}

      {olderNews.map((item) => (
        <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />
      ))}

      {isRealData && hasMore ? (
        <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore} disabled={loadingMore} activeOpacity={0.8}>
          {loadingMore ? <ActivityIndicator size="small" color="#175CD3" /> : <Text style={styles.moreButtonText}>더 많은 뉴스 보기</Text>}
        </TouchableOpacity>
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
    color: "#98A2B3",
    fontSize: 13
  },
  moreButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D1E9FF",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12
  },
  moreButtonText: {
    color: "#175CD3",
    fontSize: 14,
    fontWeight: "700"
  }
});
