import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { loadAuthSession } from "../../../lib/auth";
import { getReadingLog } from "../../../lib/readingProgress";
import { countDailyReads, localDateKey } from "../../../lib/readingProgressModel";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningPreferences } from "../../../lib/api";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function LearnScreen() {
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
      const log = await getReadingLog(session.userId);
      if (active) setReadCount(countDailyReads(log, localDateKey(new Date())));
    });
    return () => { active = false; };
  }, []));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="학습" subtitle="지금 읽는 뉴스와 투자 공부에 도움이 되는 자료예요." />

        <Text>{!loaded ? "학습 설정을 확인하고 있어요." : preferences.source === "default" ? "맞춤 학습 설정을 확인할 수 없음 · 기본 학습 가이드 (fallback)" : `${preferences.source === "local" ? "기기 내 저장 설정 (fallback) · " : ""}내 학습 목표: ${preferences.dailyGoal}`}</Text>
        <Text>{readCount === null ? "오늘 읽은 기사 수 확인할 수 없음" : `오늘 읽은 기사 ${readCount}개 · 이 계정의 기기 내 기록`}</Text>
        <GuideList focus={preferences.focus} level={preferences.level} />
        <DailyTips level={preferences.level} pace={preferences.pace} focus={preferences.focus} />
      </ScrollView>
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
