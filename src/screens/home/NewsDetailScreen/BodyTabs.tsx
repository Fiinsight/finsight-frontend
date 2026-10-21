import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type BodyTab = "raw" | "level";

interface BodyTabsProps {
  value: BodyTab;
  onChange: (tab: BodyTab) => void;
}

export function BodyTabs({ value, onChange }: BodyTabsProps) {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: value === "raw" }} style={[styles.tab, value === "raw" && styles.tabSelected]} onPress={() => onChange("raw")}>
        <Text style={[styles.tabText, value === "raw" && styles.tabTextSelected]}>원문</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: value === "level" }} style={[styles.tab, value === "level" && styles.tabSelected]} onPress={() => onChange("level")}>
        <Text style={[styles.tabText, value === "level" && styles.tabTextSelected]}>쉽게읽기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    padding: 4,
    gap: 4
  },
  tab: {
    minHeight: 44,
    justifyContent: "center",
    flex: 1,
    alignItems: "center",
    borderRadius: 6,
    paddingVertical: 10
  },
  tabSelected: {
    backgroundColor: "#FFFFFF"
  },
  tabText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700"
  },
  tabTextSelected: {
    color: "#101828"
  }
});
