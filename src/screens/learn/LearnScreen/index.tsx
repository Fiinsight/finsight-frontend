import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useQuery, useQueries } from "@tanstack/react-query";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../../../navigation/types";
import { useFocusEffect, useNavigation, useIsFocused } from "@react-navigation/native";
import { loadAuthSession } from "../../../lib/auth";
import { getReadingLog } from "../../../lib/readingProgress";
import { countDailyReads, localDateKey, resumeLearningIds, type DailyReadLog } from "../../../lib/readingProgressModel";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningPreferences, getLearningReviews, getLearningProgress, getNewsDetail } from "../../../lib/api";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function LearnScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const isFocused = useIsFocused();
  const [readingLog, setReadingLog] = useState<DailyReadLog>({});
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const reviews = useQuery({ queryKey: ["learning-reviews", ownerId], queryFn: getLearningReviews, enabled: ownerId !== null && isFocused, retry: 0, staleTime: 60_000, refetchOnWindowFocus: false });
  const progress = useQuery({ queryKey: ["learning-progress", ownerId], queryFn: getLearningProgress, enabled: ownerId !== null && isFocused, retry: 0, staleTime: 60_000, refetchOnWindowFocus: false });
  const resumeIds = progress.data ? resumeLearningIds(readingLog, progress.data.completedNewsIds) : [];
  const resumeArticles = useQueries({ queries: resumeIds.map((newsId) => ({ queryKey: ["news-detail", newsId], queryFn: () => getNewsDetail(newsId), enabled: isFocused, retry: 0, staleTime: 60_000 })) });
  const accuracy = (value: number | null) => value === null ? "아직 기록이 없어요" : `${Math.round(value * 100)}%`;
  const [preferences, setPreferences] = useState<LearningPreferences>(getDefaultLearningPreferences());

  const [readCount, setReadCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(false);
    setReadCount(null);
    void getLearningPreferences().then((value) => {
      if (active) { setPreferences(value); setLoaded(true); }
    });
    void loadAuthSession().then(async (session) => {
      if (!session) return;
      if (active) setOwnerId(session.userId);
      const log = await getReadingLog(session.userId);
      if (active) { setReadCount(countDailyReads(log, localDateKey(new Date()))); setReadingLog(log); }
    });
    return () => { active = false; };
  }, []));


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="학습" subtitle="지금 읽는 뉴스와 투자 공부에 도움이 되는 자료예요." />

        <Text>{!loaded ? "학습 설정을 확인하고 있어요." : preferences.source === "default" ? "학습 설정을 확인할 수 없어 기본 가이드를 보여드려요." : `내 학습 목표: ${preferences.dailyGoal}`}</Text>
        <Text>{readCount === null ? "오늘 읽은 기사 수 확인할 수 없음" : `오늘 읽은 기사 ${readCount}개`}</Text>
        {loaded && preferences.source === "default" ? <Pressable accessibilityRole="button" onPress={() => navigation.navigate("ProfileTab", { openLearningSettings: true })} style={styles.settingsButton}><Text style={styles.settingsButtonText}>학습 설정을 하면 더 맞춤화돼요</Text></Pressable> : null}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>나의 학습 진행도</Text>
          {progress.isPending ? <Text>진행도를 확인하고 있어요.</Text> : progress.isError ? <Pressable accessibilityRole="button" onPress={() => void progress.refetch()}><Text>진행도를 확인할 수 없습니다 · 다시 시도</Text></Pressable> : progress.data ? <>
            <Text>오늘 퀴즈 {progress.data.today.answeredCount}개 · 정답률 {accuracy(progress.data.today.accuracy)}</Text>
            <Text>이번 주 퀴즈 {progress.data.week.answeredCount}개 · 정답률 {accuracy(progress.data.week.accuracy)}</Text>
            <Text>저장된 마지막 기록 기준</Text>
            <Text>학습 활동 연속일 {progress.data.activityStreakDays}일</Text>
            <Text>판단·메모·퀴즈를 한 날 기준</Text>
            <Text>기록 탭의 출석(기사 3개 읽기)과는 다른 기록이에요.</Text>
          </> : null}
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>이어서 학습하기</Text>
          {!progress.data ? <Text>학습 기록을 확인하면 이어 읽을 기사를 보여드려요.</Text> : !resumeIds.length ? <Text>최근 읽은 기사의 퀴즈를 마쳤거나 아직 읽은 기사가 없어요.</Text> : resumeArticles.map((article, index) => article.data?.rawContent.trim() ? <Pressable key={resumeIds[index]} accessibilityRole="button" style={styles.reviewRow} onPress={() => navigation.navigate("HomeTab", { screen: "NewsDetail", params: { newsId: resumeIds[index], readMode: "level", readingLevel: preferences.level } })}><Text style={styles.reviewLink}>{article.data.title} · 퀴즈 이어 하기</Text></Pressable> : <Text key={resumeIds[index]}>{article.isPending ? "기사 제목을 확인하고 있어요." : "기사 내용을 확인할 수 없습니다."}</Text>)}
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>다시 살펴볼 분야</Text>
          {!progress.data ? <Text>판단 기록을 확인하고 있어요.</Text> : progress.data.totalDecidedCount < 3 ? <Text>판단이 쌓이면 보여드려요.</Text> : !progress.data.weakAreas.length ? <Text>분야별 비교 가능한 판단이 더 쌓이면 추천해드려요.</Text> : progress.data.weakAreas.map((area) => <View key={area.category} style={styles.reviewRow}>
            <Text>{area.category} · 확정 판단 {area.decidedCount}건 · 적중 {area.hitCount}건</Text>
            <Text>아래 학습 가이드에서 근거와 비교 기준을 다시 확인해보세요.</Text>
            {area.recentNewsIds.map((newsId) => <Pressable key={newsId} accessibilityRole="button" onPress={() => navigation.navigate("HomeTab", { screen: "NewsDetail", params: { newsId, readMode: "level" } })}><Text style={styles.reviewLink}>이 분야의 판단 기사 돌아보기</Text></Pressable>)}
          </View>)}
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>내가 복습할 개념</Text>
          <Text>퀴즈에서 틀린 개념을 다시 읽어보세요. 정답으로 다시 답하면 목록에서 제외돼요.</Text>
          {reviews.isLoading || ownerId === null ? <Text>학습 기록을 확인하고 있어요.</Text> : reviews.isError ? <Pressable accessibilityRole="button" onPress={() => void reviews.refetch()}><Text>복습 기록을 확인할 수 없습니다 · 다시 시도</Text></Pressable> : reviews.data?.length ? reviews.data.map((item) => (
            <Pressable key={`${item.newsId}-${item.term}`} accessibilityRole="button" style={styles.reviewRow} onPress={() => navigation.navigate("HomeTab", { screen: "NewsDetail", params: { newsId: item.newsId, readMode: "level", readingLevel: item.level } })}>
              <Text style={styles.reviewTitle}>{item.term}</Text><Text>{item.definition}</Text><Text style={styles.reviewLink}>{item.title} · 기사에서 복습하기</Text>
            </Pressable>
          )) : <Text>아직 복습이 필요한 개념이 없어요. 뉴스의 쉽게읽기에서 퀴즈를 풀어보세요.</Text>}
        </View>
        <GuideList focus={preferences.focus} level={preferences.level} />
        <DailyTips level={preferences.level} pace={preferences.pace} focus={preferences.focus} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingsButton: { backgroundColor: "#175CD3", borderRadius: 8, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" },
  settingsButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  reviewCard: { padding: 16, gap: 12, backgroundColor: "#FFFFFF", borderRadius: 12 },
  reviewRow: { gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EAECF0" },
  reviewTitle: { fontSize: 16, fontWeight: "700", color: "#101828" },
  reviewLink: { color: "#175CD3", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 20
  },
  headerCard: {
    minHeight: 126,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF7F2",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden"
  },
  mascot: {
    width: 88,
    height: 104,
    marginRight: 8
  },
  speechBubble: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D9EEE2"
  },
  tipLabel: {
    color: "#12B76A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5
  },
  tipText: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 19
  },
});
