import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ChoiceCardProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  accentBackground: string;
  selected: boolean;
  onPress: () => void;
}

export function ChoiceCard({ title, subtitle, iconName, accentColor, accentBackground, selected, onPress }: ChoiceCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && { borderColor: accentColor, backgroundColor: accentBackground }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: selected ? "#FFFFFF" : "#F2F4F7" }]}>
        <Ionicons name={iconName} size={20} color={accentColor} />
      </View>
      <View style={styles.textGroup}>
        <Text style={[styles.title, selected && { color: accentColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && { borderColor: accentColor }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: accentColor }]} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 14
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  textGroup: {
    flex: 1,
    gap: 2
  },
  title: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 13
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    alignItems: "center",
    justifyContent: "center"
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  }
});
