import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import packageJson from "../../../../package.json";

interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}

const rows: SettingsRow[] = [
  { icon: "notifications-outline", label: "알림 설정" },
  { icon: "school-outline", label: "읽기 수준 기본값", value: "초보자용" },
  { icon: "information-circle-outline", label: "앱 정보/버전", value: `v${packageJson.version}` },
  { icon: "log-out-outline", label: "로그아웃" }
];

export function SettingsList() {
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
          <Ionicons name={row.icon} size={18} color="#667085" />
          <Text style={styles.label}>{row.label}</Text>
          {row.value ? <Text style={styles.value}>{row.value}</Text> : null}
          <TouchableOpacity disabled hitSlop={8}>
            <Ionicons name="chevron-forward" size={16} color="#D0D5DD" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7"
  },
  rowLast: {
    borderBottomWidth: 0
  },
  label: {
    flex: 1,
    color: "#101828",
    fontSize: 14,
    fontWeight: "600"
  },
  value: {
    color: "#98A2B3",
    fontSize: 13
  }
});
