import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { AuthSession } from "../../../lib/auth";

export function ProfileHeader({ session }: { session: AuthSession }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={28} color="#667085" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name}>{session.nickname || "핀사이트 사용자"}</Text>
        {session.email && session.email !== "이메일 정보 미제공" ? <Text numberOfLines={1} style={styles.hint}>{session.email}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center"
  },
  name: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800"
  },
  hint: {
    color: "#667085",
    fontSize: 12,
    marginTop: 2
  }
});
