import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";
import { getLearningPreferences } from "../../../lib/api";
import { LearningPathCard } from "./LearningPathCard";

export function LearnScreen({ onOpenHistory }: { onOpenHistory: () => void }) {
  const [preferences, setPreferences] = useState<LearningPreferences>(getDefaultLearningPreferences());

  useEffect(() => {
    void getLearningPreferences().then(setPreferences);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>학습 자료</Text>
          <Text style={styles.subtitle}>온보딩에서 고른 관심사와 공부 방식에 맞춘 자료예요.</Text>
        </View>

        <LearningPathCard preferences={preferences} onOpenHistory={onOpenHistory} />
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
  header: {
    gap: 6
  },
  title: {
    color: "#101828",
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 14
  }
});
