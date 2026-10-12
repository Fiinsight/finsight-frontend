import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, View, Text, Pressable, Modal } from "react-native";
import type { AuthSession } from "../../../lib/auth";
import { getDefaultLearningPreferences, type LearningLevel } from "../../../lib/onboarding";
import { getLearningPreferences, setDefaultReadingLevel, saveLearningSettings, getOnboardingAnswers, deleteAccount } from "../../../lib/api";
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
  const client = useQueryClient();
  const [level, setLevel] = useState<LearningLevel>(getDefaultLearningPreferences().level);

  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, "ProfileTab">>();
  const [settingsAnswers, setSettingsAnswers] = useState<OnboardingAnswer[] | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  useEffect(() => {
    if (route.params?.openLearningSettings) { setSettingsOpen(true); navigation.setParams({ openLearningSettings: false }); }
  }, [route.params?.openLearningSettings, navigation]);
  useEffect(() => {
    if (!settingsOpen) { setSettingsAnswers(null); return; }
    void getOnboardingAnswers().then(setSettingsAnswers).catch(() => setMessage("학습 설정을 불러오지 못했어요. 닫고 다시 시도해 주세요."));
  }, [settingsOpen]);
  async function saveSettings(answers: OnboardingAnswer[]) {
    setSaving(true); setMessage("");
    try { await saveLearningSettings(answers); void client.invalidateQueries({ queryKey: ["learning-progress"] }); const prefs = await getLearningPreferences(); setLevel(prefs.level); setSettingsOpen(false); setMessage("학습 설정을 저장했어요."); }
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
      void client.invalidateQueries({ queryKey: ["learning-progress"] });
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
        <SettingsList onDeleteAccount={() => setDeleteStep(1)} level={level} onLogout={() => setLogoutConfirm(true)}
          onEditLevel={() => { setEditing(!editing); setMessage(""); }}
          onEditLearning={() => { setSettingsOpen(true); setMessage(""); }}
          onTerms={() => setLegal("terms")} onPrivacy={() => setLegal("privacy")} />
        {editing ? <View style={{ gap: 12 }}>
          <Text>기본 읽기 수준을 선택하세요. 기사에서 바꾼 수준은 그 기사에 적용됩니다.</Text>
          {(["beginner", "normal", "analyst"] as LearningLevel[]).map((value) => <Pressable key={value} accessibilityRole="button" disabled={saving} onPress={() => void saveLevel(value)} accessibilityState={{ selected: level === value }} style={{ padding: 12, backgroundColor: level === value ? "#DCE8FF" : "#FFFFFF", borderRadius: 8 }}>
            <Text>{value === "beginner" ? "초보자용" : value === "normal" ? "일반용" : "분석용"}{level === value ? " ✓ 현재 기본값" : ""}</Text>
          </Pressable>)}
          {saving ? <Text>저장 중…</Text> : null}
        </View> : null}
        {deleteStep > 0 ? <View style={{ gap: 12 }}><Text>{deleteStep === 1 ? "회원 탈퇴를 진행할까요?" : "탈퇴하면 내 판단·메모·학습 기록이 모두 삭제돼요. 되돌릴 수 없습니다."}</Text><Pressable accessibilityRole="button" accessibilityLabel="회원 탈퇴 취소" disabled={saving} onPress={() => setDeleteStep(0)}><Text>취소</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={deleteStep === 1 ? "탈퇴 다음 단계" : "회원 탈퇴 최종 확인"} disabled={saving} onPress={() => { if (deleteStep === 1) { setDeleteStep(2); return; } setSaving(true); void deleteAccount().then(onLogout).catch(() => setMessage("탈퇴 요청을 처리하지 못했어요. 다시 시도해 주세요.")).finally(() => setSaving(false)); }}><Text>{deleteStep === 1 ? "다음" : saving ? "처리 중…" : "계정과 기록 삭제"}</Text></Pressable></View> : null}
        {logoutConfirm ? <View><Text>로그아웃할까요?</Text><Pressable accessibilityRole="button" accessibilityLabel="로그아웃 취소" onPress={() => setLogoutConfirm(false)}><Text>취소</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="로그아웃 확인" onPress={onLogout}><Text>로그아웃</Text></Pressable></View> : null}
        {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      </ScrollView>
      <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => { if (!saving) setSettingsOpen(false); }}>
        <View style={{ flex: 1, backgroundColor: "#071B4A" }}>
          {message ? <Text accessibilityRole="alert" style={{ color: "#FFFFFF", padding: 16 }}>{message}</Text> : null}
          {settingsAnswers ? <OnboardingScreen initialAnswers={settingsAnswers} allowSkip={false} saving={saving} onClose={() => setSettingsOpen(false)} onComplete={(answers) => void saveSettings(answers)} /> : <Pressable accessibilityRole="button" accessibilityLabel="학습 설정 닫기" onPress={() => setSettingsOpen(false)}><View style={{ padding: 20, alignItems: "flex-end" }}><Ionicons name="close" size={24} color="#FFFFFF" /></View></Pressable>}
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
