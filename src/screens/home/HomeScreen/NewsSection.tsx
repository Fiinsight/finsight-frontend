import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NewsCard } from "../../../components/NewsCard";
import { getMoreBriefing, getTodayBriefing } from "../../../lib/api";
import type { NewsBrief } from "../../../types/api";

interface NewsSectionProps {
  onSelectNews: (newsId: number) => void;
}

export function NewsSection({ onSelectNews }: NewsSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: getTodayBriefing,
    retry: 0
  });

  const [olderNews, setOlderNews] = useState<NewsBrief[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const news = data ?? [];
  // Never present demo copy as if it were live market news. An empty state is
  // more honest and makes a failed collection/API connection visible.
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
        <Text style={styles.muted}>{isLoading ? "불러오는 중" : isError ? "연결 확인 필요" : `${news.length}개 선별`}</Text>
      </View>

      {news.length > 0 ? news.map((item) => (
        <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{isError ? "뉴스를 불러오지 못했어요" : "오늘의 뉴스를 준비하고 있어요"}</Text>
          <Text style={styles.emptyBody}>{isError ? "백엔드와 뉴스 수집 상태를 확인한 뒤 다시 시도해 주세요." : "잠시 후 실제 수집된 뉴스가 이곳에 표시됩니다."}</Text>
        </View>
      )}

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
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700"
  },
  muted: {
    color: "rgba(255,255,255,0.7)",
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
  }
});
