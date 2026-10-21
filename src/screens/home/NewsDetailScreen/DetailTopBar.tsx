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
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="뒤로가기" onPress={onBack} hitSlop={12} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#101828" />
      </TouchableOpacity>
      <View style={styles.meta}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{category}</Text>
        </View>
        <Text style={styles.timeText}>{toRelativeTimeKorean(publishedAt) || "발행 시각 확인할 수 없음"}</Text>
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  meta: {
    flex: 1,
    minWidth: 0,
    flexWrap: "wrap",
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
    color: "#667085",
    fontSize: 12
  }
});
