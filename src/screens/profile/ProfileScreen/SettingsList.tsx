import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { LearningLevel } from "../../../lib/onboarding";

interface SettingsRow {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  kind?: "logout" | "delete";
}

export function SettingsList({ level, onLogout, onEditLevel, onEditLearning, onTerms, onPrivacy, onDeleteAccount, notificationsEnabled=false, onNotificationsChange, notificationsBusy=false }: {
  notificationsEnabled?: boolean; onNotificationsChange?: (value:boolean)=>void; notificationsBusy?:boolean;
  level: LearningLevel; onLogout: () => void; onDeleteAccount: () => void;
  onEditLevel: () => void; onEditLearning: () => void; onTerms: () => void; onPrivacy: () => void;
}) {
  const levelLabel = level === "analyst" ? "분석용" : level === "normal" ? "일반용" : "초보자용";
  const sections: { title: string; rows: SettingsRow[] }[] = [
    { title: "학습", rows: [
      { icon: "options-outline", label: "학습 설정", onPress: onEditLearning },
      { icon: "school-outline", label: "읽기 수준 기본값", value: levelLabel, onPress: onEditLevel }
    ] },
    { title: "알림", rows: [{ icon: "notifications-outline", label: Platform.OS === "web" ? "알림 설정" : "판단 결과 알림", value: Platform.OS === "web" ? "준비 중" : undefined }] },
    { title: "약관 및 정보", rows: [
      { icon: "document-text-outline", label: "이용약관", onPress: onTerms },
      { icon: "shield-checkmark-outline", label: "개인정보처리방침", onPress: onPrivacy }
    ] },
    { title: "계정", rows: [
      { icon: "log-out-outline", label: "로그아웃", onPress: onLogout, kind: "logout" },
      { label: "회원 탈퇴", onPress: onDeleteAccount, kind: "delete" }
    ] }
  ];
  return <View>
    {sections.map(section => <View key={section.title}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.rows.map((row,index) => <View key={row.label}>
        {section.title === "알림" && Platform.OS !== "web" ? <View style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color="#667085" />
          <Text style={styles.label}>판단 결과 알림</Text>
          <Switch accessibilityLabel="판단 결과 알림" value={notificationsEnabled} disabled={notificationsBusy} onValueChange={onNotificationsChange} trackColor={{false:"#EAECF0",true:"#175CD3"}} />
        </View> : <Pressable accessibilityRole={row.onPress ? "button" : undefined}
          accessibilityLabel={row.value ? `${row.label}, ${row.value}` : row.label}
          accessibilityState={{ disabled: !row.onPress }} disabled={!row.onPress} onPress={row.onPress} style={styles.row}>
          {row.icon ? <Ionicons name={row.icon} size={20} color={row.kind === "logout" ? "#D92D20" : "#667085"} /> : null}
          <Text style={[styles.label,row.kind === "logout" && styles.logout,row.kind === "delete" && styles.delete]}>{row.label}</Text>
          {row.value ? <Text style={styles.value}>{row.value}</Text> : null}
          {row.onPress && !row.kind ? <Ionicons name="chevron-forward" size={16} color="#D0D5DD" /> : null}
        </Pressable>}
        {index<section.rows.length-1 ? <View style={styles.divider} /> : null}
      </View>)}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, color: "#98A2B3", marginTop: 24, marginBottom: 8 },
  row: { height: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 0 },
  divider: { height: 1, backgroundColor: "#EAECF0", marginLeft: 32 },
  label: { flex: 1, color: "#101828", fontSize: 16 },
  logout: { color: "#D92D20" },
  delete: { color: "#98A2B3", fontSize: 14 },
  value: { color: "#98A2B3", fontSize: 13 }
});
