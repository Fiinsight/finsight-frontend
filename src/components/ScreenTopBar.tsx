import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ScreenTopBarProps {
  title?: string;
  onBack: () => void;
}

/** Simple "back chevron + centered title" bar shared by pushed screens. */
export function ScreenTopBar({ title, onBack }: ScreenTopBarProps) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.side}>
        <Ionicons name="chevron-back" size={24} color="#101828" />
      </TouchableOpacity>
      {title ? <Text style={styles.title}>{title}</Text> : <View style={{ flex: 1 }} />}
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  side: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#101828",
    fontSize: 17,
    fontWeight: "800"
  }
});
