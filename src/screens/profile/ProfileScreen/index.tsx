import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import type { AuthSession } from "../../../lib/auth";
import { getDefaultLearningPreferences, loadOnboardingProfile, mapOnboardingToLearningPreferences, type LearningLevel } from "../../../lib/onboarding";
import { useEffect, useState } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { SettingsList } from "./SettingsList";

export function ProfileScreen({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [level, setLevel] = useState<LearningLevel>(getDefaultLearningPreferences().level);

  useEffect(() => {
    void loadOnboardingProfile().then((profile) => {
      if (profile) setLevel(mapOnboardingToLearningPreferences(profile.answers).level);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
