import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../../../navigation/types";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { loadAuthSession } from "../../../lib/auth";
import { getReadingLog } from "../../../lib/readingProgress";
import { countDailyReads, localDateKey } from "../../../lib/readingProgressModel";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningPreferences, getLearningReviews } from "../../../lib/api";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function LearnScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const reviews = useQuery({ queryKey: ["learning-reviews", ownerId], queryFn: getLearningReviews, enabled: ownerId !== null, retry: 0, staleTime: 0 });
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
      if (active) setReadCount(countDailyReads(log, localDateKey(new Date())));
    });
    return () => { active = false; };
  }, []));
  useFocusEffect(useCallback(() => { if (ownerId !== null) void reviews.refetch(); }, [ownerId]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="학습" subtitle="지금 읽는 뉴스와 투자 공부에 도움이 되는 자료예요." />

        <Text>{!loaded ? "학습 설정을 확인하고 있어요." : preferences.source === "default" ? "학습 설정을 확인할 수 없어 기본 가이드를 보여드려요." : `내 학습 목표: ${preferences.dailyGoal}`}</Text>
        <Text>{readCount === null ? "오늘 읽은 기사 수 확인할 수 없음" : `오늘 읽은 기사 ${readCount}개`}</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>내가 복습할 개념</Text>
          <Text>이해 확인에서 틀린 개념을 다시 읽어보세요. 정답으로 다시 답하면 목록에서 제외돼요.</Text>
          {reviews.isLoading || ownerId === null ? <Text>학습 기록을 확인하고 있어요.</Text> : reviews.isError ? <Pressable accessibilityRole="button" onPress={() => void reviews.refetch()}><Text>복습 기록을 확인할 수 없습니다 · 다시 시도</Text></Pressable> : reviews.data?.length ? reviews.data.map((item) => (
            <Pressable key={`${item.newsId}-${item.term}`} accessibilityRole="button" style={styles.reviewRow} onPress={() => navigation.navigate("HomeTab", { screen: "NewsDetail", params: { newsId: item.newsId, readMode: "level", readingLevel: item.level } })}>
              <Text style={styles.reviewTitle}>{item.term}</Text><Text>{item.definition}</Text><Text style={styles.reviewLink}>{item.title} · 기사에서 복습하기</Text>
            </Pressable>
          )) : <Text>아직 복습이 필요한 개념이 없어요. 뉴스의 쉽게 읽기에서 이해 확인을 해보세요.</Text>}
        </View>
        <GuideList focus={preferences.focus} level={preferences.level} />
        <DailyTips level={preferences.level} pace={preferences.pace} focus={preferences.focus} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  reviewCard: { padding: 16, gap: 12, backgroundColor: "#FFFFFF", borderRadius: 12 },
  reviewRow: { gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EAECF0" },
  reviewTitle: { fontSize: 16, fontWeight: "700", color: "#101828" },
  reviewLink: { color: "#175CD3", fontSize: 13, lineHeight: 20 },
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
