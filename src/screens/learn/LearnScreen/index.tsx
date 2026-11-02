import { termDefinitionPreview } from "../../../lib/termDefinitionPreview";
import type { ComponentRef } from "react";
import { colors, radius, spacing, typography } from "../../../theme";
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
import { countDailyReads, localDateKey, resumeLearningIds, resumeLearningEmptyMessage, type DailyReadLog } from "../../../lib/readingProgressModel";
import { PainPointCard } from "./PainPointCard";
import { parsePromotionSnoozes, promotionStorageKey, promotionVisible, snoozePromotion, type PromotionSnoozes } from "../../../lib/learningActions";
import { storageGetItem, storageSetItem } from "../../../lib/storage";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningRecommendations, getDailyLearningTerms, setDefaultReadingLevel, getLearningPreferences, getLearningReviews, getLearningProgress, getNewsDetail } from "../../../lib/api";

export function LearnScreen() {
  const navigation = useNavigation<CompositeNavigationProp<NativeStackNavigationProp<LearnStackParamList>, BottomTabNavigationProp<RootTabParamList>>>();
  const isFocused = useIsFocused();
  const route = useRoute<RouteProp<LearnStackParamList, "Learn">>();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const reviewRef = useRef<ComponentRef<typeof View>>(null);
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
  const reviewsLoading = ownerId !== null && reviews.isLoading;
  const progressPending = ownerId !== null && progress.isPending;
  const scrollToReviews = useCallback(() => {
    if (isFocused && loaded && ownerId !== null && !progressPending && !progress.isFetching && !reviewsLoading && !reviews.isFetching && route.params?.section === "reviews" && scroll.current) {
      const content = scroll.current.getInnerViewNode();
      if (content == null) return;
      reviewRef.current?.measureLayout(content, (_x, y) => {
        scroll.current?.scrollTo({ y, animated: true });
        navigation.setParams({ section: undefined });
      });
    }
  }, [isFocused, loaded, ownerId, progressPending, progress.isFetching, reviewsLoading, reviews.isFetching, route.params?.section, navigation]);
  useFocusEffect(scrollToReviews);
  useFocusEffect(useCallback(() => {
    let active = true;
    void getLearningPreferences().then((value) => {
      if (active) { setPreferences(value); setLoaded(true); }
    }).catch(() => { if (active) setLoaded(true); });
    void loadAuthSession().then(async (session) => {
      if (!session) {
        if (active) { setOwnerId(null); setReadingLog({}); setReadCount(0); setSnoozes({}); setPromotionReady(null); }
        return;
      }
      if (active) setOwnerId(session.userId);
      const [log, saved] = await Promise.all([getReadingLog(session.userId), storageGetItem(promotionStorageKey(session.userId))]);
      if (active) { setReadCount(countDailyReads(log, localDateKey(new Date()))); setReadingLog(log); setSnoozes(parsePromotionSnoozes(saved)); setPromotionReady(session.userId); }
    }).catch(() => { if (active) { setReadCount(null); setReadingLog({}); } });
    return () => { active = false; };
  }, []));

  const [selectedReview, setSelectedReview] = useState<NonNullable<typeof reviews.data>[number] | null>(null);
  const [info, setInfo] = useState<{ title: string; description: string; reason?: string; newsId?: number; newsTitle?: string } | null>(null);
  const [snoozes, setSnoozes] = useState<PromotionSnoozes>({});
  const [promotionReady, setPromotionReady] = useState<number | null>(null);
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});
  const deferPromotion = async () => {
    const level = progress.data?.levelSuggestion;
    if (ownerId === null || !level) return;
    const next = snoozePromotion(snoozes, level);
    try { await storageSetItem(promotionStorageKey(ownerId), JSON.stringify(next)); setSnoozes(next); setPromotionMessage("7일 뒤에 다시 제안할게요."); }
    catch { setPromotionMessage("나중에 설정을 저장하지 못했어요. 다시 시도해주세요."); }
  };
  const client = useQueryClient();
  const dailyTerms = useQuery({ queryKey: ["daily-learning-terms", ownerId], queryFn: getDailyLearningTerms, enabled: ownerId !== null && isFocused && preferences.painPoint === "terms", retry: 0, staleTime: 60_000 });
  const promotion = useMutation({ mutationFn: setDefaultReadingLevel, onSuccess: async (_result, level) => {
    setPreferences(await getLearningPreferences());
    setPromotionMessage(`${level === "normal" ? "일반용" : "분석용"}으로 변경했어요.`);
    void client.invalidateQueries({ queryKey: ["learning-progress"] });
  } });
  const goal = progress.data?.goal;
  const closeSheet = () => { setInfo(null); setSelectedReview(null); };
  const openNextTask = () => {
    if (resumeIds.length) {
      navigation.navigate("NewsDetail", { newsId: resumeIds[0], readMode: "level", readingLevel: preferences.level, openQuiz: true });
    } else if (reviews.data?.length) {
      const first = reviews.data[0];
      navigation.navigate("NewsDetail", { newsId: first.newsId, readMode: "level", readingLevel: first.level, openQuiz: true, quizTerm: first.term });
    } else if (dailyTerms.data?.length) {
      const first=dailyTerms.data[0];
      navigation.navigate("NewsDetail",{newsId:first.newsId,readMode:"level",readingLevel:preferences.level,openQuiz:true,quizTerm:first.term});
    } else {
      navigation.navigate("HomeTab", { screen: "Home" });
    }
  };
  const remainingQuizzes = [...new Set(Object.values(readingLog).flat())].filter(id => !progress.data?.completedNewsIds.includes(id)).length;
  const dailyQuizGoalDone = (progress.data?.today.answeredCount ?? 0) >= 1;
  const tasksLoading = !loaded || progressPending || !progress.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        <View style={{gap:4}}><Text accessibilityRole="header" style={{fontSize:22,fontWeight:"800",color:colors.text}}>학습</Text><Text style={styles.auxiliary}>오늘 할 일을 하나씩 이어가요.</Text></View>

        <View style={styles.hero}>
          <View style={styles.goalRow}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>오늘 할 일</Text>
            <Text style={styles.taskCount}>{progress.data ? `퀴즈 ${remainingQuizzes}개 남음` : "퀴즈 확인 중"}</Text>
          </View>
          <Text style={styles.body}>{dailyQuizGoalDone ? "오늘 퀴즈 목표를 마쳤어요. 이어서 연습해 볼까요?" : "퀴즈 1개로 오늘의 개념을 확인해 보세요."}</Text>
          <Text style={styles.auxiliary}>{goal ? `${goal.streakDays}일 연속 목표 달성` : "연속 기록 확인 중"} · 최근 읽은 기사 기준 · 기사 읽기 {readCount === null ? "연결 확인 중" : `${Math.min(readCount,3)}/3`}</Text>
          {progress.data ? <Text style={styles.auxiliary}>{progress.data.today.answeredCount >= 5 ? `오늘 정답률 ${accuracy(progress.data.today.accuracy)}` : `퀴즈 ${Math.max(0,5-progress.data.today.answeredCount)}개 더 풀면 정답률이 보여요`}</Text> : null}
          {progress.isError ? <Pressable accessibilityRole="button" accessibilityLabel="학습 진행도 다시 시도" style={styles.heroRetry} onPress={() => void progress.refetch()}><Text style={styles.link}>진행도를 불러오지 못했어요 · 다시 시도</Text></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={tasksLoading ? "오늘 할 일 확인 중" : "퀴즈 풀기"} disabled={tasksLoading} accessibilityState={{disabled:tasksLoading}} onPress={openNextTask} style={[styles.primaryButton,tasksLoading&&styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>{tasksLoading ? "오늘 할 일 확인 중" : "퀴즈 풀기"}</Text><Text style={styles.primaryButtonText} aria-hidden>→</Text>
          </Pressable>
        </View>

        {preferences.painPoint === "terms" ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>오늘의 용어 3개</Text>
          {ownerId === null ? <Text style={styles.auxiliary}>로그인하면 오늘의 용어를 확인할 수 있어요.</Text> : dailyTerms.isPending ? <View style={[styles.skeleton, styles.termSkeleton]} /> : dailyTerms.isError ? <Pressable accessibilityRole="button" accessibilityLabel="오늘의 용어 다시 시도" onPress={() => void dailyTerms.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable> : dailyTerms.data?.length ? <View style={styles.dailyTermList}>
            {dailyTerms.data.map((item,index) => <Pressable key={item.term} style={[styles.dailyTermItem,index===dailyTerms.data!.length-1 && styles.lastRow]} accessibilityRole="button" accessibilityLabel={`${item.term} 뜻 보기${item.reason === "지난번에 틀린 개념" || item.reason === "익히는 중인 개념" ? ` · ${item.reason}` : ""}`} accessibilityState={{expanded:!!expandedTerms[item.term]}} onPress={() => setExpandedTerms({...expandedTerms,[item.term]:!expandedTerms[item.term]})}>
              <View style={styles.termHeading}><Text style={styles.termText}>{item.term}</Text>{item.reason === "지난번에 틀린 개념" || item.reason === "익히는 중인 개념" ? <Text style={styles.goalBadge}>{item.reason}</Text>:null}</View>
              <Text style={styles.body} numberOfLines={expandedTerms[item.term] ? undefined : 2} ellipsizeMode="clip">{expandedTerms[item.term] ? item.definition : termDefinitionPreview(item.definition)}</Text>
              <Text style={styles.link}>{expandedTerms[item.term] ? "정의 접기" : "정의 펼치기"}</Text>
            </Pressable>)}
          </View> : <Text style={styles.auxiliary}>오늘 기사에서 새로 볼 개념을 찾지 못했어요.</Text>}
        </View> : null}
        <PainPointCard painPoint={preferences.painPoint} ownerId={ownerId} focused={isFocused}
          onArticle={newsId => navigation.navigate("NewsDetail", { newsId, readMode: "level", readingLevel: preferences.level })}
          onHistory={initialTab => navigation.navigate("HistoryTab", { screen: "History", params: { initialTab } })} />

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>이어서 풀 퀴즈</Text>
          <Text style={styles.auxiliary}>읽었지만 아직 퀴즈를 풀지 않은 기사예요</Text>
          {progressPending ? [0, 1].map((key) => <View key={key} style={styles.articleRow} accessibilityLabel="이어서 풀 퀴즈 기사 불러오는 중">
            <View style={[styles.skeleton, styles.chipSkeleton]} /><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} />
          </View>) : progress.isError ? <View style={styles.section}><Text style={styles.body}>이어서 풀 퀴즈 기사를 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="이어서 풀 퀴즈 다시 시도" style={styles.retryButton} onPress={() => void progress.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>
          : !resumeIds.length ? <Text style={styles.auxiliary}>{resumeLearningEmptyMessage(readingLog, progress.data?.completedNewsIds ?? [])}</Text>
          : resumeArticles.slice(0, 3).map((article, index) => article.isPending ? <View key={resumeIds[index]} style={styles.articleRow} accessibilityLabel="기사 제목 불러오는 중">
            <View style={[styles.skeleton, styles.chipSkeleton]} /><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} />
          </View> : article.data?.rawContent.trim() ? <Pressable key={resumeIds[index]} accessibilityRole="button" accessibilityLabel={`${article.data.title} · 퀴즈 이어 풀기`} style={styles.articleRow}
            onPress={() => navigation.navigate("NewsDetail", { newsId: resumeIds[index], readMode: "level", readingLevel: preferences.level, openQuiz: true })}>
            <View style={styles.articleMeta}><Text style={styles.categoryChip}>{article.data.category}</Text><Text style={styles.remainingBadge}>퀴즈 남음</Text></View>
            <Text style={styles.articleTitle} numberOfLines={2}>{article.data.title}</Text>
            <Text style={styles.link}>퀴즈 풀기 →</Text>
          </Pressable> : <View key={resumeIds[index]} style={styles.articleRow}><Text style={styles.auxiliary}>기사 내용을 확인할 수 없어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="기사 다시 시도" style={styles.retryButton} onPress={() => void article.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>)}
        </View>

        <View style={styles.section} ref={reviewRef} onLayout={scrollToReviews}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>다시 볼 개념</Text>
          <Text style={styles.auxiliary}>퀴즈에서 틀렸거나 아직 익숙하지 않은 개념이에요</Text>
          {ownerId === null ? <Text style={styles.auxiliary}>로그인하면 다시 볼 개념을 확인할 수 있어요.</Text> : reviewsLoading ? <View style={styles.termRow}>{[0, 1, 2].map(key => <View key={key} style={[styles.skeleton, styles.termSkeleton]} accessibilityLabel="다시 볼 개념 불러오는 중" />)}</View>
          : reviews.isError ? <><Text style={styles.body}>다시 볼 개념을 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="다시 볼 개념 다시 시도" style={styles.retryButton} onPress={() => void reviews.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></>
          : reviews.data?.length ? <View>
            {reviews.data.map((item,index) => <Pressable key={`${item.newsId}-${item.term}`} accessibilityRole="button" accessibilityLabel={`${item.term} 뜻과 다시 풀 기사 보기`} style={[styles.reviewRow,index===reviews.data!.length-1 && styles.lastRow]} onPress={() => setSelectedReview(item)}>
              <Text style={styles.termText}>{item.term}</Text>
              <Text style={styles.auxiliary} numberOfLines={2}>{item.definition}</Text>
            </Pressable>)}
          </View> : <Text style={styles.auxiliary}>아직 틀린 개념이 없어요. 퀴즈를 풀면 여기에 모여요</Text>}
        </View>

        {ownerId !== null && (recommendations.isPending || recommendations.isError || recommendedArticles.length) ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{recommendedArticles.some(item=>item.basis==="WATCHLIST") ? "관심종목과 이어 읽기" : "비슷한 기사 더 읽기"}</Text>
          <Text style={styles.auxiliary}>{recommendedArticles.some(item=>item.basis==="WATCHLIST") ? "관심종목 소식과 내가 공부한 주제를 함께 살펴보세요" : "내가 공부한 기사와 비슷한 주제예요"}</Text>
          {recommendations.isPending ? <View style={[styles.section, { minHeight: 140 }]}><View style={[styles.skeleton, styles.titleSkeleton]} /><View style={[styles.skeleton, styles.shortSkeleton]} /></View>
            : recommendations.isError ? <View style={styles.section}><Text style={styles.auxiliary}>추천 기사를 확인하지 못했어요.</Text><Pressable accessibilityRole="button" accessibilityLabel="추천 기사 다시 시도" style={styles.retryButton} onPress={() => void recommendations.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable></View>
            : recommendedArticles.length ? recommendedArticles.slice(0, 3).map(item => <Pressable key={item.newsId} style={styles.articleRow} accessibilityRole="button" accessibilityLabel={`${item.title} 추천 기사 읽기`} onPress={() => navigation.navigate("NewsDetail", { newsId: item.newsId, readMode: "level", readingLevel: preferences.level })}>
              <Text style={styles.categoryChip}>{item.category ?? "뉴스"}</Text><Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.body} numberOfLines={2}>{item.summary}</Text><Text style={styles.auxiliary} numberOfLines={2}>{item.reason}</Text>
            </Pressable>) : null}
        </View> : null}

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>내 개념 숙련도</Text>
          {progressPending ? <View style={[styles.skeleton, { height: 180 }]} accessibilityLabel="개념 숙련도 불러오는 중" />
            : progress.isError ? <Pressable accessibilityRole="button" accessibilityLabel="개념 숙련도 다시 시도" style={styles.retryButton} onPress={() => void progress.refetch()}><Text style={styles.link}>다시 시도</Text></Pressable>
            : progress.data?.mastery ? <>
              <Text style={styles.auxiliary}>{progress.data.mastery.totalAttempts ? `최근 퀴즈 ${progress.data.mastery.totalAttempts}회 기준 추정` : "퀴즈를 풀면 개념별 숙련도를 추정해드려요."}</Text>
              {[{ title: "잘 아는 개념", rows: progress.data.mastery.strongest }, { title: `익히는 중 ${progress.data.mastery.learningCount ?? 0}개`, rows: progress.data.mastery.learning ?? [] }].map(group => <View key={group.title} style={styles.section}>
                <Text style={styles.articleTitle}>{group.title}</Text>
                {!group.rows.length ? <Text style={styles.auxiliary}>아직 충분히 풀지 않았어요</Text> : null}
                {group.rows.map(item => {
                  const value = Math.round(Math.max(0, Math.min(1, item.effectivePKnown)) * 100);
                  return <View key={item.term} style={styles.masteryRow}>
                    <View style={styles.articleMeta}><Text style={[styles.body, { flex: 1 }]} numberOfLines={1}>{item.term}</Text><Text style={styles.auxiliary}>{value}%</Text></View>
                    <View accessibilityRole="progressbar" accessibilityLabel={`${item.term} 추정 숙련도`} accessibilityValue={{ min: 0, max: 100, now: value }} style={styles.masteryTrack}><View style={[styles.masteryFill, { width: `${value}%` }]} /></View>
                  </View>;
                })}
              </View>)}
            </> : <Text style={styles.auxiliary}>퀴즈를 풀면 개념별 숙련도를 추정해드려요.</Text>}
          <Text style={styles.auxiliary}>80% 이상·3번 이상 풀면 잘 아는 개념이에요</Text>
        </View>

        {promotionReady === ownerId && ownerId !== null && progress.data?.levelSuggestion && promotionVisible(snoozes, progress.data.levelSuggestion) ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{progress.data.levelSuggestion === "normal" ? "일반용으로 읽어볼까요?" : "분석용으로 읽어볼까요?"}</Text>
          <Text style={styles.body}>최근 퀴즈에서 개념을 꾸준히 이해하고 있어요. 원할 때 수준을 바꿀 수 있어요.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="제안된 읽기 수준으로 변경" style={styles.retryButton} disabled={promotion.isPending} onPress={() => promotion.mutate(progress.data!.levelSuggestion!)}><Text style={styles.link}>이 수준으로 읽기</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="수준 변경 제안 7일 뒤에 보기" style={styles.retryButton} disabled={promotion.isPending} onPress={() => void deferPromotion()}><Text style={styles.link}>나중에</Text></Pressable>
          {promotion.isError ? <Text style={styles.auxiliary}>수준을 변경하지 못했어요. 다시 시도해주세요.</Text> : null}
        </View> : null}
        {promotionMessage ? <Text accessibilityRole="alert" style={styles.body}>{promotionMessage}</Text> : null}
        {loaded ? <>
          <GuideList focus={preferences.focus} level={preferences.level} />
          <DailyTips level={preferences.level} pace={preferences.pace} focus={preferences.focus} />
        </> : <View style={[styles.skeleton, { height: 180 }]} accessibilityLabel="맞춤 가이드와 팁 불러오는 중" />}

        {progress.data?.weakAreas.length ? <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>판단 결과가 엇갈린 분야</Text>
          {progress.data.weakAreas.map((area) => <View key={area.category} style={styles.articleRow}>
            <Text style={styles.articleTitle}>{area.category}</Text><Text style={styles.auxiliary}>최근 30일 표본 {area.sampleSize}건 · 적중 {area.hitCount}건</Text>
            <Text style={styles.body}>주가 방향 결과의 차이이며 개념 이해도를 뜻하지 않아요. 관련 기사에서 당시 근거를 점검해보세요.</Text>
            {(area.recentArticles ?? area.recentNewsIds.map(newsId => ({ newsId, title: `판단 기사 #${newsId}` }))).map(article => <Pressable key={article.newsId} accessibilityRole="button" accessibilityLabel={`${article.title} 다시 읽기`} style={styles.retryButton} onPress={() => navigation.navigate("NewsDetail", { newsId: article.newsId, readMode: "level" })}><Text style={styles.link}>{article.title} →</Text></Pressable>)}
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
  taskCount: {color:colors.primary,fontSize:15,fontWeight:typography.weight.semibold,textAlign:"right"},
  goalBadge: {color:colors.muted,fontSize:15,paddingHorizontal:6,paddingVertical:3,borderRadius:4},
  dailyTermList: {gap:12},
  dailyTermItem: {minHeight:100,padding:16,gap:8,borderWidth:1,borderRadius:12,backgroundColor:colors.surface,borderColor:colors.borderStrong},
  termHeading: {flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:8},
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  container: { width:"100%",maxWidth:880,alignSelf:"center",padding: spacing.lg, paddingBottom: 40, gap: spacing.xl },
  section: { gap: spacing.sm, padding:spacing.md, backgroundColor:colors.surface, borderWidth:1, borderColor:colors.border, borderRadius:radius.card },
  sectionTitle: { fontSize: typography.size.subheading, fontWeight: typography.weight.bold, color: colors.text, lineHeight: typography.lineHeight.heading },
  body: { fontSize: typography.size.reading, lineHeight: typography.lineHeight.body, color: colors.text },
  auxiliary: { fontSize: 15, lineHeight: typography.lineHeight.compact, color: colors.muted },
  hero: { backgroundColor: colors.surface, borderWidth:1, borderColor:colors.borderStrong, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm },
  goalRow: { flexDirection: "row", justifyContent:"space-between", flexWrap:"wrap", alignItems: "center", gap: spacing.xs, minHeight: 26 },
  heroRetry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  primaryButton: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.control, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { color: colors.surface, fontSize: typography.size.reading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  disabledButton: { opacity: 0.6 },
  articleRow: { minHeight: 80, paddingVertical: spacing.md, gap: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  articleMeta: { flexDirection: "row", gap: spacing.xs, alignItems: "center", justifyContent: "space-between" },
  categoryChip: { color: colors.body, borderRadius: radius.small, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  remainingBadge: { color: colors.primary, backgroundColor:colors.primarySoft, borderWidth:1, borderColor:colors.primary, borderRadius: radius.small, paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, fontSize: 15, lineHeight: 22, fontWeight: typography.weight.bold, flexShrink: 0 },
  articleTitle: { color: colors.text, fontSize: typography.size.reading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  retryButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  link: { fontSize: typography.size.reading, lineHeight: typography.lineHeight.body, fontWeight: typography.weight.bold, color: colors.body },
  termRow: { flexDirection: "row", gap: 10 },
  reviewRow: { minHeight: 64, paddingVertical: spacing.sm, gap: spacing.xxs, borderBottomWidth:0.5,borderBottomColor:colors.border },
  lastRow: {borderBottomWidth:0},
  termText: { fontSize: typography.size.reading, lineHeight: typography.lineHeight.body, fontWeight: typography.weight.bold, color: colors.body },
  skeleton: { backgroundColor: colors.border, borderRadius: radius.small },
  masteryRow: {gap:6,paddingVertical:spacing.sm,borderBottomWidth:0.5,borderBottomColor:colors.border},
  masteryTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  masteryFill: { height: 8, backgroundColor: colors.muted, borderRadius: 4 },
  chipSkeleton: { width: 72, height: 24 },
  titleSkeleton: { width: "100%", height: 20 },
  shortSkeleton: { width: "75%", height: 16 },
  termSkeleton: { flex: 1, height: 44, borderRadius: radius.card },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  dismissArea: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.muted, fontSize: typography.size.display },
  sheetAction: { minHeight: 48, borderRadius: radius.control, backgroundColor: colors.text, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  sheetActionText: { color: colors.surface, fontSize: typography.size.reading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body }
});
