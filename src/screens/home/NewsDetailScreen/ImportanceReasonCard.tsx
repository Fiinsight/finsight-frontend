import { StyleSheet, Text, View } from "react-native";

export function ImportanceReasonCard({ reason }: { reason: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>왜 중요한가</Text>
      <Text style={styles.body}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EFF4FF",
    borderRadius: 8,
    padding: 16,
    gap: 6
  },
  label: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "800"
  },
  body: {
    color: "#344054",
    fontSize: 14,
    lineHeight: 21
  }
});
