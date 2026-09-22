import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";
import { getDefaultLearningPreferences, loadOnboardingProfile, mapOnboardingToLearningPreferences, type LearningPreferences } from "../../../lib/onboarding";

export function LearnScreen() {
  const [preferences, setPreferences] = useState<LearningPreferences>(getDefaultLearningPreferences());

  useEffect(() => {
    void loadOnboardingProfile().then((profile) => {
      if (profile) setPreferences(mapOnboardingToLearningPreferences(profile.answers));
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>학습 자료</Text>
          <Text style={styles.subtitle}>{preferences.focus === "decision" ? "판단의 근거를 쌓아보세요" : "지금의 투자 습관에 맞춰 골라봤어요"}</Text>
        </View>

        <GuideList focus={preferences.focus} level={preferences.level} />
        <DailyTips level={preferences.level} pace={preferences.pace} />
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
  header: {
    gap: 4
  },
  title: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 14
  }
});
