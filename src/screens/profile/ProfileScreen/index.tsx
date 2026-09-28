import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import type { AuthSession } from "../../../lib/auth";
import { getDefaultLearningPreferences, type LearningLevel } from "../../../lib/onboarding";
import { getLearningPreferences } from "../../../lib/api";
import { useEffect, useState } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { SettingsList } from "./SettingsList";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function ProfileScreen({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [level, setLevel] = useState<LearningLevel>(getDefaultLearningPreferences().level);

  useEffect(() => {
    void getLearningPreferences().then((preferences) => setLevel(preferences.level));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="프로필" subtitle="내 투자 학습과 계정 설정을 관리하세요." />
        <ProfileHeader session={session} />
        <SettingsList level={level} onLogout={onLogout} />
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
    gap: 24
  }
});
