import { StyleSheet, Text, View } from "react-native";
import { ChoiceCard } from "../../../components/ChoiceCard";
import type { JudgementChoice } from "../../../types/api";

const CHOICES: {
  key: JudgementChoice;
  title: string;
  subtitle: string;
  icon: "trending-up" | "remove" | "trending-down";
  color: string;
  background: string;
}[] = [
  { key: "UP", title: "상승", subtitle: "주가가 오를 것으로 예상", icon: "trending-up", color: "#12B76A", background: "#ECFDF3" },
  { key: "NEUTRAL", title: "중립", subtitle: "큰 변화가 없을 것으로 예상", icon: "remove", color: "#667085", background: "#F2F4F7" },
  // Down keeps the app's existing "하락 = blue" Korean-market color convention.
  { key: "DOWN", title: "하락", subtitle: "주가가 떨어질 것으로 예상", icon: "trending-down", color: "#175CD3", background: "#D1E9FF" }
];

interface DirectionChoicesProps {
  value?: JudgementChoice;
  onChange: (choice: JudgementChoice) => void;
}

export function DirectionChoices({ value, onChange }: DirectionChoicesProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.sectionTitle}>예상 방향을 선택하세요</Text>
      {CHOICES.map((option) => (
        <ChoiceCard
          key={option.key}
          title={option.title}
          subtitle={option.subtitle}
          iconName={option.icon}
          accentColor={option.color}
          accentBackground={option.background}
          selected={value === option.key}
          onPress={() => onChange(option.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10
  },
  sectionTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800"
  }
});
