import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { NewsCard } from "../../../components/NewsCard";
import { getMoreBriefing, getTodayBriefing } from "../../../lib/api";
import type { NewsBrief } from "../../../types/api";

interface NewsSectionProps {
  onSelectNews: (newsId: number) => void;
}

export function NewsSection({ onSelectNews }: NewsSectionProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["today-briefing"],
    queryFn: getTodayBriefing,
    retry: 0,
    staleTime: 60_000
  });

  const [olderNews, setOlderNews] = useState<NewsBrief[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [moreError, setMoreError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const news = data ?? [];
  // Never present demo copy as if it were live market news. An empty state is
  // more honest and makes a failed collection/API connection visible.
  const isRealData = !!data;

  const handleLoadMore = async () => {
    if (!isRealData || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setMoreError(false);
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
      setMoreError(true);
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
          {isError ? <Pressable accessibilityRole="button" onPress={() => void refetch()} style={styles.moreButton}><Text style={styles.moreButtonText}>다시 시도</Text></Pressable> : null}
          <Text style={styles.emptyBody}>{isError ? "연결을 확인하고 다시 시도해 주세요." : "잠시 후 실제 수집된 뉴스가 이곳에 표시됩니다."}</Text>
        </View>
      )}

      {olderNews.map((item) => (
        <NewsCard key={item.id} news={item} onPress={() => onSelectNews(item.id)} />
      ))}

      {moreError ? <Text accessibilityRole="alert" style={styles.emptyBody}>추가 뉴스를 불러오지 못했어요. 이미 불러온 뉴스는 유지합니다.</Text> : null}
      {isRealData && hasMore ? (
        <Pressable accessibilityRole="button" style={styles.moreButton} onPress={() => void handleLoadMore()} disabled={loadingMore}>
          {loadingMore ? <ActivityIndicator size="small" color="#175CD3" /> : <Text style={styles.moreButtonText}>{moreError ? "다시 불러오기" : "더 많은 뉴스 보기"}</Text>}
        </Pressable>
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
