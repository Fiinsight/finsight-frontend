import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity } from "react-native";

interface SourceLinkRowProps {
  source: string;
  url: string;
}

export function SourceLinkRow({ source, url }: SourceLinkRowProps) {
  if (!url) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(url)} hitSlop={8}>
      <Text style={styles.text} numberOfLines={1}>
        {source ? `${source} 원문 보기` : "원문 보기"}
      </Text>
      <Ionicons name="open-outline" size={14} color="#175CD3" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start"
  },
  text: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "700"
  }
});
