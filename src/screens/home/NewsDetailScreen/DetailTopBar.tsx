import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../../../lib/format";

interface DetailTopBarProps {
  category: string;
  publishedAt: string;
  onBack: () => void;
}

export function DetailTopBar({ category, publishedAt, onBack }: DetailTopBarProps) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#101828" />
      </TouchableOpacity>
      <View style={styles.meta}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{category}</Text>
        </View>
        <Text style={styles.timeText}>{toRelativeTimeKorean(publishedAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  categoryPill: {
    backgroundColor: "#EFF4FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  categoryPillText: {
    color: "#175CD3",
    fontSize: 12,
    fontWeight: "700"
  },
  timeText: {
    color: "#98A2B3",
    fontSize: 12
  }
});
