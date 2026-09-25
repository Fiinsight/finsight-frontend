import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { LevelTabs } from "../../../components/LevelTabs";
import { TermPopup } from "../../../components/TermPopup";
import { getLearningPreferences, getNewsDetail } from "../../../lib/api";
import { getSampleNewsDetail } from "../../../lib/sampleData";
import type { NewsFlowParamList } from "../../../navigation/types";
import { useAppStore } from "../../../store/useAppStore";
import type { NewsDetail, ReadingLevel } from "../../../types/api";
import { ArticleBody } from "./ArticleBody";
import { BodyTabs, type BodyTab } from "./BodyTabs";
import { DetailTopBar } from "./DetailTopBar";
import { ImportanceReasonCard } from "./ImportanceReasonCard";
import { SentimentBadge } from "./SentimentBadge";
import { SourceLinkRow } from "./SourceLinkRow";
import { ArticleNotesPanel } from "./ArticleNotesPanel";
import { recordArticleRead } from "../../../lib/readingProgress";

type Props = NativeStackScreenProps<NewsFlowParamList, "NewsDetail">;

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

  const { data } = useQuery({
    queryKey: ["news-detail", newsId],
    queryFn: () => getNewsDetail(newsId),
    retry: 0
  });

  useEffect(() => {
    // Opening a loaded article counts as reading it; the daily goal is three
    // distinct articles, not a timed dwell requirement.
    if (!data || !isFocused) return;
    void recordArticleRead(newsId);
  }, [data?.id, isFocused, newsId]);

  const detail: NewsDetail = data ?? getSampleNewsDetail(newsId);
  const levelText = detail.levels[readingLevel] || detail.summary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DetailTopBar category={detail.category} publishedAt={detail.publishedAt} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{detail.title}</Text>
        <SentimentBadge sentiment={detail.sentimentHint} />
        <SourceLinkRow source={detail.source} url={detail.url} />

        <BodyTabs value={bodyTab} onChange={setBodyTab} />

        {bodyTab === "level" ? <LevelTabs value={readingLevel} onChange={(level: ReadingLevel) => setReadingLevel(newsId, level)} /> : null}

        <View style={styles.bodyCard}>
          <ArticleBody text={bodyTab === "raw" ? detail.rawContent : levelText} terms={detail.keyTerms} onTermPress={setSelectedTerm} />
        </View>

        <ImportanceReasonCard reason={detail.importanceReason} />
        <ArticleNotesPanel newsId={newsId} />
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
  }
});
