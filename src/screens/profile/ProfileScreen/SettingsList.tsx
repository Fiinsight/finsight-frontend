import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { LearningLevel } from "../../../lib/onboarding";

interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

export function SettingsList({ level, onLogout, onEditLevel, onEditLearning, onTerms, onPrivacy, onDeleteAccount, notificationsEnabled = false, onNotificationsPress }: {
  notificationsEnabled?: boolean; onNotificationsPress?: () => void;
  level: LearningLevel; onLogout: () => void; onDeleteAccount: () => void;
  onEditLevel: () => void; onEditLearning: () => void; onTerms: () => void; onPrivacy: () => void;
}) {
  const levelLabel = level === "analyst" ? "분석용" : level === "normal" ? "일반용" : "초보자용";
  const rows: SettingsRow[] = [
    { icon: "options-outline", label: "학습 설정", onPress: onEditLearning },
    { icon: "school-outline", label: "읽기 수준 기본값", value: levelLabel, onPress: onEditLevel },
    { icon: "notifications-outline", label: "알림 설정", value: Platform.OS === "web" ? "준비 중" : notificationsEnabled ? "켜짐" : "꺼짐", onPress: Platform.OS === "web" ? undefined : onNotificationsPress },
    { icon: "document-text-outline", label: "이용약관", onPress: onTerms },
    { icon: "shield-checkmark-outline", label: "개인정보처리방침", onPress: onPrivacy },
    { icon: "information-circle-outline", label: "버전 정보", value: "v0.1.0" },
    { icon: "log-out-outline", label: "로그아웃", onPress: onLogout },
    { icon: "person-remove-outline", label: "회원 탈퇴", onPress: onDeleteAccount }
  ];
  return <View style={styles.list}>
    {rows.map(row => <Pressable key={row.label} accessibilityRole={row.onPress ? "button" : undefined}
      accessibilityLabel={row.value ? `${row.label}, ${row.value}` : row.label}
      accessibilityState={{ disabled: !row.onPress }} disabled={!row.onPress} onPress={row.onPress} style={styles.row}>
      <Ionicons name={row.icon} size={22} color="#667085" accessible={false} />
      <Text style={styles.label}>{row.label}</Text>
      {row.value ? <Text style={styles.value}>{row.value}</Text> : null}
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { marginTop: 24 },
  row: { height: 56, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 0 },
  label: { flex: 1, color: "#101828", fontSize: 16, fontWeight: "400" },
  value: { color: "#667085", fontSize: 14 }
});
