import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { LevelTabs } from "../../../components/LevelTabs";
import { TermPopup } from "../../../components/TermPopup";
import { getLearningPreferences, getNewsDetail } from "../../../lib/api";
import type { NewsFlowParamList, RootTabParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import type { NewsDetail, ReadingLevel } from "../../../types/api";
import { LearningPanel } from "./LearningPanel";
import { ArticleBody } from "./ArticleBody";
import { BodyTabs, type BodyTab } from "./BodyTabs";
import { DetailTopBar } from "./DetailTopBar";
import { ImportanceReasonCard } from "./ImportanceReasonCard";
import { SourceLinkRow } from "./SourceLinkRow";
import { ArticleNotesPanel } from "./ArticleNotesPanel";
import { recordArticleRead } from "../../../lib/readingProgress";
import { LocalMlPanel } from "../../../localml/LocalMlPanel";
import { searchLocalMl } from "../../../localml/transport";

type Props = NativeStackScreenProps<NewsFlowParamList, "NewsDetail">;

export function NewsDetailScreen({ route, navigation }: Props) {
  const client = useQueryClient();
  const scroll = useRef<ScrollView>(null);
  const quizLayout = useRef<{ panel?: number; quiz?: number }>({});
  const scrollToQuiz = () => {
    if (route.params.openQuiz && quizLayout.current.panel !== undefined && quizLayout.current.quiz !== undefined) {
      scroll.current?.scrollTo({ y: quizLayout.current.panel + quizLayout.current.quiz, animated: true });
      navigation.setParams({ openQuiz: undefined });
    }
  };
  const { newsId } = route.params;
  const isFocused = useIsFocused();
  const [bodyTab, setBodyTab] = useState<BodyTab>(route.params.readMode ?? "raw");
  useEffect(() => { if (route.params.readMode) setBodyTab(route.params.readMode); }, [newsId, route.params.readMode]);
  const [showTerms, setShowTerms] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const storedReadingLevel = useAppStore((state) => state.readingLevelByNewsId[newsId]);
  const setReadingLevel = useAppStore((state) => state.setReadingLevel);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferredLevel, setPreferredLevel] = useState<ReadingLevel>("beginner");

  useEffect(() => {
    let active = true;
    setPreferencesReady(false);
    void getLearningPreferences().then((preferences) => {
      if (!active) return;
      setPreferredLevel(preferences.level);
      setShowTerms(preferences.painPoint === "terms");
      if (!route.params.readMode) setBodyTab(preferences.painPoint === "overload" ? "level" : "raw");
      setPreferencesReady(true);
    });
    return () => { active = false; };
  }, [newsId, route.params.readMode]);

  const readingLevel = route.params.readingLevel ?? storedReadingLevel ?? preferredLevel;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0,
    staleTime: 60_000
  });

  useEffect(() => {
    // Opening a loaded article counts as reading it; the daily goal is three
    // distinct articles, not a timed dwell requirement.
    if (!preferencesReady || !data?.rawContent.trim() || !isFocused) return;
    void recordArticleRead(newsId).then(() => {
      void client.invalidateQueries({ queryKey: ["learning-progress"] });
      void client.invalidateQueries({ queryKey: ["learning-recommendations"] });
    });
  }, [data?.id, isFocused, newsId, preferencesReady, client]);

  if (!data || !preferencesReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>{isLoading || !preferencesReady ? "뉴스를 불러오는 중이에요" : "뉴스를 불러오지 못했어요"}</Text>
          <Text style={styles.errorBody}>{isError ? "실제 기사 데이터를 확인할 수 없어 예시 내용을 표시하지 않습니다." : "잠시만 기다려주세요."}</Text>
          {isError ? <Pressable style={styles.retryButton} onPress={() => void refetch()}><Text style={styles.retryText}>다시 시도</Text></Pressable> : null}
          <Pressable onPress={() => navigation.goBack()}><Text style={styles.backText}>돌아가기</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const detail: NewsDetail = data;
  const hasContent = !!detail.rawContent.trim();
  const importanceReason = detail.importanceReason;
  const rawExcerpt = detail.rawContent;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DetailTopBar category={detail.category} publishedAt={detail.publishedAt} onBack={() => navigation.goBack()} />

      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{detail.title}</Text>
        <SourceLinkRow source={detail.source} url={detail.url} />

        {hasContent ? <BodyTabs value={bodyTab} onChange={setBodyTab} /> : <Text>원문 링크에서 확인하세요.</Text>}

        {hasContent && bodyTab === "level" ? <LevelTabs value={readingLevel} onChange={(level: ReadingLevel) => setReadingLevel(newsId, level)} /> : null}

        {hasContent ? (bodyTab === "raw" ? <View style={styles.bodyCard}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: showTerms }} accessibilityLabel="용어 밑줄 표시" onPress={() => setShowTerms(!showTerms)}><Text style={styles.backText}>용어 밑줄 {showTerms ? "켜짐" : "꺼짐"}</Text></Pressable>
          <ArticleBody text={rawExcerpt} terms={showTerms ? detail.keyTerms : []} onTermPress={setSelectedTerm} />
        </View> : <View onLayout={event => { quizLayout.current.panel = event.nativeEvent.layout.y; scrollToQuiz(); }}><LearningPanel key={`${newsId}-${readingLevel}-${route.params.quizTerm ?? ""}`} newsId={newsId} level={readingLevel} quizTerm={route.params.quizTerm} onTermPress={setSelectedTerm}
          onQuizLayout={y => { quizLayout.current.quiz = y; scrollToQuiz(); }}
          onReviewPress={() => navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate("LearnTab", { screen: "Learn", params: { section: "reviews" } })} /></View>) : null}

        {hasContent && bodyTab === "raw" ? (
          <LocalMlPanel
            title="비슷한 뉴스"
            excludeNewsId={newsId}
            onNewsPress={(id) => navigation.push("NewsDetail", { newsId: id })}
            request={{ kind: "news", query: detail.title }}
            search={searchLocalMl}
          />
        ) : null}

        {hasContent && bodyTab === "raw" && importanceReason ? <ImportanceReasonCard reason={importanceReason} /> : null}
        {hasContent ? <View onLayout={(event) => { if (route.params.openNotes) scroll.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: true }); }}><ArticleNotesPanel newsId={newsId} sourceUrl={detail.url} /></View> : null}
      </ScrollView>

      {hasContent ? detail.judgementTarget?.symbol ? <BottomActionBar label="판단하기" onPress={() => navigation.navigate("Judgement", { newsId })} /> : <View style={{ padding: 20 }}><Text style={{ color: "#667085", fontSize: 14 }}>이 기사는 판단할 대상이 없어요</Text></View> : null}

      <TermPopup visible={!!selectedTerm} term={selectedTerm} newsId={newsId} level={readingLevel} onClose={() => setSelectedTerm(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16
  },
  title: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30
  },
  bodyCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12
  },
  errorTitle: { color: "#101828", fontSize: 18, fontWeight: "800", textAlign: "center" },
  errorBody: { color: "#667085", fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: { backgroundColor: "#175CD3", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  backText: { color: "#175CD3", fontSize: 14, fontWeight: "700" }
});
