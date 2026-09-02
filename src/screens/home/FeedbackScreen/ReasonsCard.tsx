import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ReasonsCardProps {
  aligned: boolean;
  reasons: string[];
}

export function ReasonsCard({ aligned, reasons }: ReasonsCardProps) {
  const [expanded, setExpanded] = useState(true);
  const title = aligned ? "왜 정확한 판단인가요?" : "무엇이 다르게 작용했나요?";

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={() => setExpanded((prev) => !prev)}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#667085" />
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.list}>
          {reasons.map((reason, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800"
  },
  list: {
    gap: 10
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  check: {
    color: "#12B76A",
    fontWeight: "800"
  },
  reasonText: {
    flex: 1,
    color: "#344054",
    fontSize: 14,
    lineHeight: 20
  }
});
