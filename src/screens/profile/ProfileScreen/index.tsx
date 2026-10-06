import { SafeAreaView, ScrollView, StyleSheet, View, Text, Pressable, Modal } from "react-native";
import type { AuthSession } from "../../../lib/auth";
import { getDefaultLearningPreferences, type LearningLevel } from "../../../lib/onboarding";
import { getLearningPreferences, setDefaultReadingLevel, saveLearningSettings } from "../../../lib/api";
import { useEffect, useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../../../navigation/types";
import { OnboardingScreen } from "../../onboarding/OnboardingScreen";
import type { OnboardingAnswer } from "../../../lib/onboarding";
import { LegalScreen } from "../../legal/LegalScreen";
import { ProfileHeader } from "./ProfileHeader";
import { SettingsList } from "./SettingsList";
import { TabScreenHeader } from "../../../components/TabScreenHeader";

export function ProfileScreen({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [level, setLevel] = useState<LearningLevel>(getDefaultLearningPreferences().level);

  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, "ProfileTab">>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  useEffect(() => {
    if (route.params?.openLearningSettings) { setSettingsOpen(true); navigation.setParams({ openLearningSettings: false }); }
  }, [route.params?.openLearningSettings, navigation]);
  async function saveSettings(answers: OnboardingAnswer[]) {
    setSaving(true); setMessage("");
    try { await saveLearningSettings(answers); const prefs = await getLearningPreferences(); setLevel(prefs.level); setSettingsOpen(false); setMessage("학습 설정을 저장했어요."); }
    catch { setMessage("학습 설정을 저장하지 못했어요. 다시 시도해 주세요."); }
    finally { setSaving(false); }
  }
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function saveLevel(next: LearningLevel) {
    setSaving(true); setMessage("");
    try {
      await setDefaultReadingLevel(next);
      setLevel(next); setEditing(false); setMessage("이 계정의 기본 읽기 수준을 저장했어요.");
    } catch { setMessage("수준을 저장하지 못했습니다. 기존 설정을 유지합니다 · 다시 시도해 주세요."); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    void getLearningPreferences().then((preferences) => setLevel(preferences.level));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TabScreenHeader title="프로필" subtitle="내 투자 학습과 계정 설정을 관리하세요." />
        <ProfileHeader session={session} />
        <SettingsList level={level} onLogout={onLogout} onEditLevel={() => { setEditing(!editing); setMessage(""); }} />
        <Pressable accessibilityRole="button" onPress={() => { setSettingsOpen(true); setMessage(""); }} style={styles.menu}><Text>학습 설정 · 수준, 학습 목표, 관심 분야 →</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setLegal("terms")} style={styles.menu}><Text>이용약관 →</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setLegal("privacy")} style={styles.menu}><Text>개인정보처리방침 →</Text></Pressable>
        {editing ? <View style={{ gap: 12 }}>
          <Text>기본 읽기 수준을 선택하세요. 기사에서 바꾼 수준은 그 기사에 적용됩니다.</Text>
          {(["beginner", "normal", "analyst"] as LearningLevel[]).map((value) => <Pressable key={value} accessibilityRole="button" disabled={saving} onPress={() => void saveLevel(value)} style={{ padding: 12, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
            <Text>{value === "beginner" ? "초보자용" : value === "normal" ? "일반용" : "분석용"}{level === value ? " · 현재 기본값" : ""}</Text>
          </Pressable>)}
          {saving ? <Text>저장 중…</Text> : null}
        </View> : null}
        {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      </ScrollView>
      <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => { if (!saving) setSettingsOpen(false); }}>
        <View style={{ flex: 1 }}><Pressable accessibilityRole="button" disabled={saving} style={styles.menu} onPress={() => setSettingsOpen(false)}><Text>닫기</Text></Pressable>
          {message ? <Text accessibilityRole="alert">{message}</Text> : null}
          <OnboardingScreen allowSkip={false} saving={saving} onComplete={(answers) => void saveSettings(answers)} />
        </View>
      </Modal>
      <Modal visible={legal !== null} animationType="slide" onRequestClose={() => setLegal(null)}>
        <LegalScreen kind={legal ?? "terms"} onBack={() => setLegal(null)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menu: { padding: 16, backgroundColor: "#FFFFFF", borderRadius: 10 },
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
