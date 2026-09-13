import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ReadingLevel } from "../types/api";

const LEVELS: { key: ReadingLevel; label: string }[] = [
  { key: "beginner", label: "초보자용" },
  { key: "normal", label: "일반용" },
  { key: "analyst", label: "분석용" }
];

interface LevelTabsProps {
  value: ReadingLevel;
  onChange: (level: ReadingLevel) => void;
}

export function LevelTabs({ value, onChange }: LevelTabsProps) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const selected = level.key === value;
        return (
          <TouchableOpacity
            key={level.key}
            style={[styles.chip, selected && styles.chipSelected]}
            activeOpacity={0.85}
            onPress={() => onChange(level.key)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{level.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8
  },
  chip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EAECF0",
    backgroundColor: "#F9FAFB",
    paddingVertical: 9
  },
  chipSelected: {
    backgroundColor: "#175CD3",
    borderColor: "#175CD3"
  },
  chipText: {
    color: "#475467",
    fontSize: 13,
    fontWeight: "700"
  },
  chipTextSelected: {
    color: "#FFFFFF"
  }
});
