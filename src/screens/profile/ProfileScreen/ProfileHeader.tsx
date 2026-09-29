import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { AuthSession } from "../../../lib/auth";

export function ProfileHeader({ session }: { session: AuthSession }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={28} color="#98A2B3" />
      </View>
      <View>
        <Text style={styles.name}>{session.nickname || "핀사이트 사용자"}</Text>
        <Text style={styles.hint}>{session.email || "이메일 정보 미제공"}</Text>
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
    color: "#98A2B3",
    fontSize: 12,
    marginTop: 2
  }
});
