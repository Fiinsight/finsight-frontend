import { useCallback, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View, Modal } from "react-native";
import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import type { CompositeNavigationProp, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList, LearnStackParamList } from "../../../navigation/types";
import { useFocusEffect, useNavigation, useIsFocused, useRoute } from "@react-navigation/native";
import { loadAuthSession } from "../../../lib/auth";
import { getReadingLog } from "../../../lib/readingProgress";
import { countDailyReads, DAILY_ARTICLE_GOAL, localDateKey, resumeLearningIds, type DailyReadLog } from "../../../lib/readingProgressModel";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningRecommendations, getDailyLearningTerms, setDefaultReadingLevel, getLearningPreferences, getLearningReviews, getLearningProgress, getNewsDetail } from "../../../lib/api";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function LearnScreen() {
  const navigation = useNavigation<CompositeNavigationProp<NativeStackNavigationProp<LearnStackParamList>, BottomTabNavigationProp<RootTabParamList>>>();
  const isFocused = useIsFocused();
  const route = useRoute<RouteProp<LearnStackParamList, "Learn">>();
  const scroll = useRef<ScrollView>(null);
  const reviewRef = useRef<View>(null);
  const [readingLog, setReadingLog] = useState<DailyReadLog>({});
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const reviews = useQuery({ queryKey: ["learning-reviews", ownerId], queryFn: getLearningReviews, enabled: ownerId !== null && isFocused, retry: 0, staleTime: 60_000, refetchOnWindowFocus: false });
  const progress = useQuery({ queryKey: ["learning-progress", ownerId], queryFn: getLearningProgress, enabled: ownerId !== null && isFocused, retry: 0, staleTime: 60_000, refetchOnWindowFocus: false });
  const recommendations = useQuery({ queryKey: ["learning-recommendations", ownerId], queryFn: getLearningRecommendations, enabled: ownerId !== null && isFocused, retry: 0, staleTime: 60_000, refetchOnWindowFocus: false });
  const recommendedArticles = recommendations.data?.items.filter(item => item.basis === "WATCHLIST" || item.basis !== "RULE_RECENT" && item.reasonNewsId != null) ?? [];
  const resumeIds = progress.data ? resumeLearningIds(readingLog, progress.data.completedNewsIds) : [];
  const resumeArticles = useQueries({ queries: resumeIds.map((newsId) => ({ queryKey: ["news-detail", newsId], queryFn: () => getNewsDetail(newsId), enabled: isFocused, retry: 0, staleTime: 60_000 })) });
  const accuracy = (value: number | null) => value === null ? "아직 기록이 없어요" : `${Math.round(value * 100)}%`;
  const [preferences, setPreferences] = useState<LearningPreferences>(getDefaultLearningPreferences());

  const [readCount, setReadCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollToReviews = useCallback(() => {
    if (isFocused && loaded && ownerId !== null && !progress.isPending && !progress.isFetching && !reviews.isLoading && !reviews.isFetching && route.params?.section === "reviews" && scroll.current) {
      reviewRef.current?.measureLayout(scroll.current.getInnerViewNode(), (_x, y) => {
        scroll.current?.scrollTo({ y, animated: true });
        navigation.setParams({ section: undefined });
      });
    }
  }, [isFocused, loaded, ownerId, progress.isPending, progress.isFetching, reviews.isLoading, reviews.isFetching, route.params?.section, navigation]);
  useFocusEffect(scrollToReviews);
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

  const [selectedReview, setSelectedReview] = useState<NonNullable<typeof reviews.data>[number] | null>(null);
  const [info, setInfo] = useState<{ title: string; description: string; reason?: string; newsId?: number; newsTitle?: string } | null>(null);
  const client = useQueryClient();
  const dailyTerms = useQuery({ queryKey: ["daily-learning-terms", ownerId], queryFn: getDailyLearningTerms, enabled: ownerId !== null && isFocused && preferences.painPoint === "terms", retry: 0, staleTime: 60_000 });
  const promotion = useMutation({ mutationFn: setDefaultReadingLevel, onSuccess: async () => {
    setPreferences(await getLearningPreferences());
    void client.invalidateQueries({ queryKey: ["learning-progress"] });
  } });
  const goal = progress.data?.goal;
  const goalAction = () => {
    if (goal?.type === "reviewJudgement") navigation.navigate("HistoryTab", { screen: "History", params: { initialTab: "judgements" } });
    else if (goal?.type === "memo") {
      const id = resumeIds[0] ?? Object.values(readingLog).flat().at(-1);
      if (id) navigation.navigate("NewsDetail", { newsId: id, openNotes: true });
      else navigation.navigate("HomeTab", { screen: "Home" });
    } else if (goal?.type === "minutes5") openNextTask();
    else navigation.navigate("HomeTab", { screen: "Home" });
  };
  const goalActionLabel = goal?.type === "memo" ? "기사 메모 남기기" : goal?.type === "reviewJudgement" ? "판단 돌아보기" : goal?.type === "minutes5" ? "학습 활동 이어가기" : "오늘의 뉴스 읽기";
  const closeSheet = () => { setInfo(null); setSelectedReview(null); };
  const openNextTask = () => {
    if (resumeIds.length) {
      navigation.navigate("NewsDetail", { newsId: resumeIds[0], readMode: "level", readingLevel: preferences.level, openQuiz: true });
    } else if (reviews.data?.length) {
      const first = reviews.data[0];
      navigation.navigate("NewsDetail", { newsId: first.newsId, readMode: "level", readingLevel: first.level, openQuiz: true, quizTerm: first.term });
    } else {
      navigation.navigate("HomeTab", { screen: "Home" });
    }
  };
  const nextTaskHint = resumeIds.length ? "이어서 풀 퀴즈로 이동해요" : reviews.data?.length ? "다시 볼 개념으로 돌아가요" : "홈에서 오늘의 뉴스를 읽어보세요";
  const metrics = [
    { label: "오늘 읽은 기사", value: readCount === null ? "-" : `${Math.min(readCount, DAILY_ARTICLE_GOAL)}/${DAILY_ARTICLE_GOAL}`, loading: readCount === null && !loaded,
      description: "기사 3개를 읽으면 수달 배지가 자동으로 찍혀요. 같은 기사를 다시 읽어도 한 번만 세며, 기록 탭과 동일한 한국 시간 기준이에요." },
    { label: "오늘 퀴즈", value: progress.data ? `${progress.data.today.answeredCount}개` : "-", loading: progress.isPending,
      description: "오늘 답한 퀴즈 수예요. 다시 풀었을 때는 저장된 마지막 답변을 기준으로 보여드려요." },
    { label: "연속 학습", value: progress.data ? `${progress.data.activityStreakDays}일` : "-", loading: progress.isPending,
      description: "판단·메모·퀴즈를 남긴 날이 연속으로 이어진 기간이에요. 기록 탭의 출석은 하루에 기사 3개를 읽는 기준이에요." }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        <TabScreenHeader title="학습" subtitle="오늘 할 일을 하나씩 이어가요." />

        <View style={styles.hero}>
          <View style={styles.goalRow}><Text style={styles.goalLabel}>학습 목표</Text>
            {loaded ? <Text style={styles.goalValue} numberOfLines={1} accessibilityLabel={`학습 목표 ${preferences.dailyGoal}`}>{preferences.dailyGoal}</Text> : <View style={[styles.skeleton, styles.goalSkeleton]} accessibilityLabel="학습 목표 불러오는 중" />}
          </View>
          {goal ? <Text style={styles.heroAuxiliary}>{goal.achievedToday ? "✓ 오늘 목표 달성" : "○ 오늘 목표 진행 중"} · 연속 달성 {goal.streakDays}일</Text> : null}
          {goal?.type === "minutes5" ? <Text style={styles.heroAuxiliary}>활동 3개 = 5분 학습 (퀴즈·메모·판단 기준)</Text> : null}
          <View style={styles.metrics}>
            {metrics.map((metric) => <View key={metric.label} style={styles.metricTile}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${metric.label} 기준 안내`} hitSlop={8} style={styles.infoButton}
                onPress={() => setInfo({ title: metric.label, description: metric.description })}><Text style={styles.infoIcon}>ⓘ</Text></Pressable>
              {metric.loading ? <View style={[styles.skeleton, styles.numberSkeleton]} accessibilityLabel={`${metric.label} 불러오는 중`} /> : <Text style={styles.metricValue}>{metric.value}</Text>}
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>)}
          </View>
          <View style={styles.accuracyArea}>
            {progress.isPending ? <View style={[styles.skeleton, styles.accuracySkeleton]} /> : progress.data ? <Text style={styles.heroAuxiliary}>
              {progress.data.today.answeredCount >= 5 ? `오늘 정답률 ${accuracy(progress.data.today.accuracy)}` : `퀴즈 ${5 - progress.data.today.answeredCount}개 더 풀면 정답률이 보여요`}
              {progress.data.week.answeredCount >= 5 ? ` · 이번 주 ${accuracy(progress.data.week.accuracy)}` : ""}
            </Text> : <Text style={styles.heroAuxiliary}>학습 진행도를 확인할 수 없어요.</Text>}
          </View>
          {progress.isError ? <Pressable accessibilityRole="button" accessibilityLabel="학습 진행도 다시 시도" style={styles.heroRetry} onPress={() => void progress.refetch()}><Text style={styles.heroAuxiliary}>다시 시도</Text></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={progress.isPending || reviews.isLoading ? "다음 할 일 확인 중" : goal && !goal.achievedToday ? goalActionLabel : `다음 할 일 · ${nextTaskHint}`} accessibilityState={{ disabled: progress.isPending || reviews.isLoading }}
            disabled={progress.isPending || reviews.isLoading} onPress={goal && !goal.achievedToday ? goalAction : openNextTask} style={[styles.primaryButton, (progress.isPending || reviews.isLoading) && styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>{goal && !goal.achievedToday ? goalActionLabel : "다음 할 일"}</Text><Text style={styles.primaryButtonText} aria-hidden>→</Text>
          </Pressable>
          <Text style={styles.heroAuxiliary}>{progress.isPending || reviews.isLoading ? "다음 할 일을 확인하고 있어요" : goal && !goal.achievedToday ? "오늘 목표를 이어가세요" : nextTaskHint}</Text>
          {loaded && preferences.source === "default" ? <Pressable accessibilityRole="button" accessibilityLabel="프로필에서 학습 설정하기" onPress={() => navigation.navigate("ProfileTab", { openLearningSettings: true })}><Text style={styles.heroAuxiliary}>기본 학습 목표예요 · 학습 설정하기</Text></Pressable> : null}
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>풀다 만 퀴즈</Text>
          <Text style={styles.auxiliary}>읽었지만 아직 퀴즈를 풀지 않은 기사예요</Text>
          {progress.isPending ? [0, 1].map((key) => <View key={key} style={styles.articleCard} accessibilityLabel="풀다 만 퀴즈 기사 불러오는 중">
            <View style={[styles.skeleton, styles.chipSkeleton]} /><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} />
          </View>) : progress.isError ? <View style={styles.card}><Text style={styles.body}>풀다 만 퀴즈 기사를 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="풀다 만 퀴즈 다시 시도" style={styles.retryButton} onPress={() => void progress.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>
          : !resumeIds.length ? <Text style={styles.auxiliary}>{Object.keys(readingLog).length ? "최근 읽은 기사의 퀴즈를 모두 마쳤어요." : "아직 읽은 기사가 없어요. 오늘의 뉴스부터 시작해보세요."}</Text>
          : resumeArticles.slice(0, 3).map((article, index) => article.isPending ? <View key={resumeIds[index]} style={styles.articleCard} accessibilityLabel="기사 제목 불러오는 중">
            <View style={[styles.skeleton, styles.chipSkeleton]} /><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} />
          </View> : article.data?.rawContent.trim() ? <Pressable key={resumeIds[index]} accessibilityRole="button" accessibilityLabel={`${article.data.title} · 퀴즈 이어 풀기`} style={styles.articleCard}
            onPress={() => navigation.navigate("NewsDetail", { newsId: resumeIds[index], readMode: "level", readingLevel: preferences.level, openQuiz: true })}>
            <View style={styles.articleMeta}><Text style={styles.categoryChip}>{article.data.category}</Text><Text style={styles.remainingBadge}>퀴즈 남음</Text></View>
            <Text style={styles.articleTitle} numberOfLines={2}>{article.data.title}</Text>
          </Pressable> : <View key={resumeIds[index]} style={styles.articleCard}><Text style={styles.auxiliary}>기사 내용을 확인할 수 없어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="기사 다시 시도" style={styles.retryButton} onPress={() => void article.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>)}
        </View>

        <View style={styles.section} ref={reviewRef} onLayout={scrollToReviews}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>다시 볼 개념</Text>
          <Text style={styles.auxiliary}>퀴즈에서 틀렸거나 아직 익숙하지 않은 개념이에요</Text>
          {reviews.isLoading || ownerId === null ? <View style={styles.termRow}>{[0, 1, 2].map(key => <View key={key} style={[styles.skeleton, styles.termSkeleton]} accessibilityLabel="다시 볼 개념 불러오는 중" />)}</View>
          : reviews.isError ? <><Text style={styles.body}>다시 볼 개념을 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="다시 볼 개념 다시 시도" style={styles.retryButton} onPress={() => void reviews.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></>
          : reviews.data?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termRow}>
            {reviews.data.map(item => <Pressable key={`${item.newsId}-${item.term}`} accessibilityRole="button" accessibilityLabel={`${item.term} 뜻과 다시 풀 기사 보기`} style={styles.termChip} onPress={() => setSelectedReview(item)}><Text style={styles.termText} numberOfLines={1}>{item.term}</Text></Pressable>)}
          </ScrollView> : <Text style={styles.auxiliary}>지금은 다시 볼 개념이 없어요</Text>}
        </View>

        {recommendations.isPending || recommendations.isError || recommendedArticles.length ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{recommendedArticles.some(item=>item.basis==="WATCHLIST") ? "관심종목과 이어 읽기" : "비슷한 기사 더 읽기"}</Text>
          <Text style={styles.auxiliary}>{recommendedArticles.some(item=>item.basis==="WATCHLIST") ? "관심종목 소식과 내가 공부한 주제를 함께 살펴보세요" : "내가 공부한 기사와 비슷한 주제예요"}</Text>
          {recommendations.isPending ? <View style={[styles.card, { minHeight: 140 }]}><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} /></View>
            : recommendations.isError ? <View style={styles.card}><Text style={styles.auxiliary}>추천 기사를 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="추천 기사 다시 시도" style={styles.retryButton} onPress={() => void recommendations.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>
            : recommendedArticles.length ? recommendedArticles.slice(0, 3).map(item => <Pressable key={item.newsId} style={styles.card} accessibilityRole="button" accessibilityLabel={`${item.title} 추천 기사 읽기`} onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId, readMode: "level", readingLevel: preferences.level })}>
              <Text style={styles.categoryChip}>{item.category ?? "뉴스"}</Text><Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.body} numberOfLines={2}>{item.summary}</Text><Text style={styles.auxiliary} numberOfLines={2}>{item.reason}</Text>
            </Pressable>) : null}
        </View> : null}

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>내 개념 숙련도</Text>
          {progress.isPending ? <View style={[styles.skeleton, { height: 180 }]} accessibilityLabel="개념 숙련도 불러오는 중" />
            : progress.isError ? <Pressable accessibilityRole="button" accessibilityLabel="개념 숙련도 다시 시도" style={styles.retryButton} onPress={() => void progress.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable>
            : progress.data?.mastery ? <>
              <Text style={styles.auxiliary}>{progress.data.mastery.totalAttempts ? `최근 퀴즈 ${progress.data.mastery.totalAttempts}회 기준 추정` : "퀴즈를 풀면 개념별 숙련도를 추정해드려요."}</Text>
              {[{ title: "잘 아는 개념", rows: progress.data.mastery.strongest }, { title: "다시 볼 개념", rows: progress.data.mastery.weakest }].map(group => <View key={group.title} style={styles.section}>
                <Text style={styles.articleTitle}>{group.title}</Text>
                {!group.rows.length ? <Text style={styles.auxiliary}>아직 충분히 풀지 않았어요</Text> : null}
                {group.rows.map(item => {
                  const value = Math.round(Math.max(0, Math.min(1, item.effectivePKnown)) * 100);
                  return <View key={item.term} style={{ gap: 6 }}>
                    <View style={styles.articleMeta}><Text style={[styles.body, { flex: 1 }]} numberOfLines={1}>{item.term}</Text><Text style={styles.auxiliary}>{value}%</Text></View>
                    <View accessibilityRole="progressbar" accessibilityLabel={`${item.term} 추정 숙련도`} accessibilityValue={{ min: 0, max: 100, now: value }} style={styles.masteryTrack}><View style={[styles.masteryFill, { width: `${value}%` }]} /></View>
                  </View>;
                })}
              </View>)}
              <Text style={styles.auxiliary}>익히는 중 {progress.data.mastery.learningCount ?? 0}개</Text>
            </> : <Text style={styles.auxiliary}>퀴즈를 풀면 개념별 숙련도를 추정해드려요.</Text>}
          <Text style={styles.auxiliary}>80% 이상·3번 이상 풀면 잘 아는 개념이에요</Text>
        </View>

        {preferences.painPoint === "terms" ? <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>오늘의 용어 3개</Text>
          {dailyTerms.isPending ? <View style={[styles.skeleton, styles.termSkeleton]} /> : dailyTerms.isError ? <Pressable accessibilityRole="button" accessibilityLabel="오늘의 용어 다시 시도" onPress={() => void dailyTerms.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable> : dailyTerms.data?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termRow}>
            {dailyTerms.data.map(item => <Pressable key={item.term} style={[styles.termChip, { width: 150, borderRadius: 12, gap: 4 }]} accessibilityRole="button" accessibilityLabel={`${item.term} 뜻 보기 · ${item.reason}`} onPress={() => setInfo({ title: item.term, description: item.definition, reason: item.reason, newsId: item.newsId, newsTitle: item.title })}><Text style={styles.termText} numberOfLines={1}>{item.term}</Text><Text style={styles.auxiliary}>{item.reason}</Text></Pressable>)}
          </ScrollView> : <Text style={styles.auxiliary}>오늘 기사에서 새로 볼 개념을 찾지 못했어요.</Text>}
        </View> : null}
        {progress.data?.levelSuggestion ? <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{progress.data.levelSuggestion === "normal" ? "일반용으로 읽어볼까요?" : "분석용으로 읽어볼까요?"}</Text>
          <Text style={styles.body}>최근 퀴즈에서 개념을 꾸준히 이해하고 있어요. 원할 때 수준을 바꿀 수 있어요.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="제안된 읽기 수준으로 변경" disabled={promotion.isPending} onPress={() => promotion.mutate(progress.data!.levelSuggestion!)}><Text style={styles.link}>이 수준으로 읽기</Text></Pressable>
          {promotion.isError ? <Text style={styles.auxiliary}>수준을 변경하지 못했어요. 다시 시도해주세요.</Text> : null}
        </View> : null}
        <GuideList focus={preferences.focus} level={preferences.level} />
        <DailyTips level={preferences.level} pace={preferences.pace} focus={preferences.focus} />

        {progress.data?.weakAreas.length ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>다시 살펴볼 분야</Text>
          {progress.data.weakAreas.map((area) => <View key={area.category} style={styles.card}>
            <Text style={styles.articleTitle}>{area.category}</Text><Text style={styles.auxiliary}>최근 30일 표본 {area.sampleSize}건 · 적중 {area.hitCount}건</Text>
            <Text style={styles.body}>관련 기사를 다시 읽고 판단 근거를 점검해보세요.</Text>
            {area.recentNewsIds.map((newsId) => <Pressable key={newsId} accessibilityRole="button" accessibilityLabel={`${area.category} 판단 기사 다시 읽기`} style={styles.retryButton} onPress={() => navigation.navigate("NewsDetail", { newsId, readMode: "level" })}><Text style={styles.link}>판단 기사 다시 읽기 →</Text></Pressable>)}
          </View>)}
        </View> : null}
      </ScrollView>

      <Modal visible={!!info || !!selectedReview} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.backdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="학습 안내 창 닫기" style={styles.dismissArea} onPress={closeSheet} />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>{selectedReview?.term ?? info?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="학습 안내 닫기" style={styles.closeButton} onPress={closeSheet}><Text style={styles.closeText}>×</Text></Pressable></View>
            <Text style={styles.body}>{selectedReview?.definition ?? info?.description}</Text>
            {info?.reason ? <Text style={styles.auxiliary}>{info.reason}</Text> : null}
            {info?.newsId ? <><Text style={styles.auxiliary} numberOfLines={2}>{info.newsTitle}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${info.title} 오늘 기사에서 읽기`} style={styles.sheetAction} onPress={() => { const newsId = info.newsId!; closeSheet(); navigation.navigate("NewsDetail", { newsId, readMode: "level", readingLevel: preferences.level }); }}><Text style={styles.sheetActionText}>이 용어가 나온 오늘 기사 읽기</Text></Pressable></> : null}
            {selectedReview ? <><Text style={styles.auxiliary} numberOfLines={2}>{selectedReview.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${selectedReview.term} 이 개념이 나온 기사 다시 풀기`} style={styles.sheetAction} onPress={() => { const item = selectedReview; closeSheet(); navigation.navigate("NewsDetail", { newsId: item.newsId, readMode: "level", readingLevel: item.level, openQuiz: true, quizTerm: item.term }); }}><Text style={styles.sheetActionText}>이 개념이 나온 기사 다시 풀기</Text></Pressable></> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 40, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#101828", lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22, color: "#344054" },
  auxiliary: { fontSize: 13, lineHeight: 20, color: "#667085" },
  card: { borderRadius: 16, padding: 20, gap: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EAECF0" },
  hero: { backgroundColor: "#175CD3", borderRadius: 16, padding: 20, gap: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 26 },
  goalLabel: { flexShrink: 0, color: "#D5E1FF", fontSize: 12, lineHeight: 16 },
  goalValue: { flex: 1, minWidth: 0, color: "#FFFFFF", fontSize: 18, fontWeight: "700", lineHeight: 26 },
  metrics: { flexDirection: "row", gap: 8 },
  metricTile: { flex: 1, minWidth: 0, minHeight: 112, padding: 6, paddingTop: 30, backgroundColor: "#FFFFFF", borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 6 },
  metricValue: { fontSize: 26, lineHeight: 32, fontWeight: "700", color: "#101828", textAlign: "center" },
  metricLabel: { fontSize: 12, lineHeight: 17, color: "#667085", textAlign: "center", minHeight: 34 },
  infoButton: { position: "absolute", top: 2, right: 2, width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  infoIcon: { color: "#667085", fontSize: 17 },
  accuracyArea: { minHeight: 40, justifyContent: "center" },
  heroAuxiliary: { color: "#D5E1FF", fontSize: 13, lineHeight: 20 },
  heroRetry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  primaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { color: "#175CD3", fontSize: 15, fontWeight: "700", lineHeight: 22 },
  disabledButton: { opacity: 0.6 },
  articleCard: { minHeight: 116, borderRadius: 16, padding: 20, gap: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EAECF0" },
  articleMeta: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" },
  categoryChip: { color: "#175CD3", backgroundColor: "#EFF4FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, lineHeight: 16, flexShrink: 1 },
  remainingBadge: { color: "#667085", backgroundColor: "#F2F4F7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, lineHeight: 16, fontWeight: "700", flexShrink: 0 },
  articleTitle: { color: "#101828", fontSize: 15, fontWeight: "700", lineHeight: 22 },
  retryButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: "#175CD3" },
  termRow: { flexDirection: "row", gap: 10 },
  termChip: { minHeight: 44, maxWidth: 260, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: "#EFF4FF", justifyContent: "center" },
  termText: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: "#175CD3" },
  skeleton: { backgroundColor: "#EAECF0", borderRadius: 6 },
  masteryTrack: { height: 8, backgroundColor: "#EAECF0", borderRadius: 4, overflow: "hidden" },
  masteryFill: { height: 8, backgroundColor: "#175CD3", borderRadius: 4 },
  goalSkeleton: { width: "75%", height: 26 },
  numberSkeleton: { width: 48, height: 32 },
  accuracySkeleton: { width: "90%", height: 20 },
  chipSkeleton: { width: 72, height: 24 },
  titleSkeleton: { width: "100%", height: 20 },
  shortSkeleton: { width: "75%", height: 16 },
  termSkeleton: { flex: 1, height: 44, borderRadius: 22 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16,24,40,0.35)" },
  dismissArea: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, gap: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#667085", fontSize: 26 },
  sheetAction: { minHeight: 48, borderRadius: 12, backgroundColor: "#175CD3", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  sheetActionText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 22 }
});
