import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import packageJson from "../../../../package.json";
import type { LearningLevel } from "../../../lib/onboarding";

interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

export function SettingsList({ level, onLogout, onEditLevel, onEditLearning, onTerms, onPrivacy, onDeleteAccount }: {
  level: LearningLevel;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onEditLevel: () => void;
  onEditLearning: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
}) {
  const levelLabel = level === "analyst" ? "분석용" : level === "normal" ? "일반용" : "초보자용";
  const rows: SettingsRow[] = [
    { icon: "options-outline", label: "학습 설정", onPress: onEditLearning },
    { icon: "school-outline", label: "읽기 수준 기본값", value: levelLabel, onPress: onEditLevel },
    { icon: "notifications-outline", label: "알림 설정", value: "준비 중" },
    { icon: "document-text-outline", label: "이용약관", onPress: onTerms },
    { icon: "shield-checkmark-outline", label: "개인정보처리방침", onPress: onPrivacy },
    { icon: "information-circle-outline", label: "앱 정보/버전", value: `v${packageJson.version}` },
    { icon: "log-out-outline", label: "로그아웃", onPress: onLogout },
    { icon: "trash-outline", label: "회원 탈퇴", onPress: onDeleteAccount }
  ];
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <Pressable
          key={row.label}
          accessibilityRole={row.onPress ? "button" : undefined}
          accessibilityLabel={row.value ? `${row.label}, ${row.value}` : row.label}
          accessibilityState={{ disabled: !row.onPress }}
          disabled={!row.onPress}
          onPress={row.onPress}
          style={[styles.row, index === rows.length - 1 && styles.rowLast]}
        >
          <Ionicons name={row.icon} size={18} color="#667085" />
          <Text style={styles.label}>{row.label}</Text>
          {row.value ? <Text style={styles.value}>{row.value}</Text> : null}
          {row.onPress ? <Ionicons name="chevron-forward" size={16} color="#D0D5DD" /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderColor: "#EAECF0", borderWidth: 1, borderRadius: 8, paddingHorizontal: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 14, minHeight: 48, borderBottomWidth: 1, borderBottomColor: "#F2F4F7" },
  rowLast: { borderBottomWidth: 0 },
  label: { flex: 1, color: "#101828", fontSize: 14, fontWeight: "600" },
  value: { color: "#98A2B3", fontSize: 13 }
});
