import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { LevelTabs } from "../../../components/LevelTabs";
import { TermPopup } from "../../../components/TermPopup";
import { getLearningPreferences, getNewsDetail } from "../../../lib/api";
import type { NewsFlowParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import type { NewsDetail, ReadingLevel } from "../../../types/api";
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
const MAX_IN_APP_EXCERPT_LENGTH = 1200;

export function NewsDetailScreen({ route, navigation }: Props) {
  const { newsId } = route.params;
  const isFocused = useIsFocused();
  const [bodyTab, setBodyTab] = useState<BodyTab>("raw");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const storedReadingLevel = useAppStore((state) => state.readingLevelByNewsId[newsId]);
  const setReadingLevel = useAppStore((state) => state.setReadingLevel);
  const [preferredLevel, setPreferredLevel] = useState<ReadingLevel>("beginner");

  useEffect(() => {
    void getLearningPreferences().then((preferences) => setPreferredLevel(preferences.level));
  }, []);

  const readingLevel = storedReadingLevel ?? preferredLevel;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0,
    staleTime: 60_000
  });

  useEffect(() => {
    // Opening a loaded article counts as reading it; the daily goal is three
    // distinct articles, not a timed dwell requirement.
    if (!data || !isFocused) return;
    void recordArticleRead(newsId);
  }, [data?.id, isFocused, newsId]);

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>{isLoading ? "뉴스를 불러오는 중이에요" : "뉴스를 불러오지 못했어요"}</Text>
          <Text style={styles.errorBody}>{isError ? "실제 기사 데이터를 확인할 수 없어 예시 내용을 표시하지 않습니다." : "잠시만 기다려주세요."}</Text>
          {isError ? <Pressable style={styles.retryButton} onPress={() => void refetch()}><Text style={styles.retryText}>다시 시도</Text></Pressable> : null}
          <Pressable onPress={() => navigation.goBack()}><Text style={styles.backText}>돌아가기</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const detail: NewsDetail = data;
  const levelText = detail.levels[readingLevel] || detail.summary;
  const importanceReason = detail.importanceReasons?.[readingLevel] || detail.importanceReason;
  const rawExcerpt = detail.rawContent.length > MAX_IN_APP_EXCERPT_LENGTH
    ? `${detail.rawContent.slice(0, MAX_IN_APP_EXCERPT_LENGTH).trim()}\n\n전체 원문은 위 출처 링크에서 확인하세요.`
    : detail.rawContent;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DetailTopBar category={detail.category} publishedAt={detail.publishedAt} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{detail.title}</Text>
        <SourceLinkRow source={detail.source} url={detail.url} />

        <BodyTabs value={bodyTab} onChange={setBodyTab} />

        {bodyTab === "level" ? <LevelTabs value={readingLevel} onChange={(level: ReadingLevel) => setReadingLevel(newsId, level)} /> : null}

        <View style={styles.bodyCard}>
          <ArticleBody text={bodyTab === "raw" ? rawExcerpt : levelText} terms={detail.keyTerms} onTermPress={setSelectedTerm} />
        </View>

        <LocalMlPanel
          title="비슷한 뉴스"
          onNewsPress={(id) => navigation.push("NewsDetail", { newsId: id })}
          request={{ kind: "news", query: detail.title, endAt: detail.publishedAt }}
          search={searchLocalMl}
        />

        {selectedTerm ? (
          <LocalMlPanel
            title={`${selectedTerm} 관련 용어 자료`}
            request={{ kind: "term", query: selectedTerm, term: selectedTerm }}
            search={searchLocalMl}
          />
        ) : null}

        <ImportanceReasonCard reason={importanceReason} />
        <ArticleNotesPanel newsId={newsId} sourceUrl={detail.url} />
      </ScrollView>

      <BottomActionBar label="판단하기" onPress={() => navigation.navigate("Judgement", { newsId })} />

      <TermPopup visible={!!selectedTerm} term={selectedTerm} newsId={newsId} onClose={() => setSelectedTerm(null)} />
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
