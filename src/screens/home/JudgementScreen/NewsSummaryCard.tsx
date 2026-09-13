import { StyleSheet, Text, View } from "react-native";

export function NewsSummaryCard({ summary }: { summary: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>뉴스 요약</Text>
      <Text style={styles.body}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 6
  },
  label: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "700"
  },
  body: {
    color: "#344054",
    fontSize: 14,
    lineHeight: 21
  }
});
