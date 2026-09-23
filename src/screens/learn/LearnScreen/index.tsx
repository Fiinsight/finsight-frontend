import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { getTodayTip } from "./DailyTips";
import { GuideList } from "./GuideList";

export function LearnScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Image source={require("../../../../assets/finsight-mascot-logo.png")} style={styles.mascot} resizeMode="contain" />
          <View style={styles.speechBubble}>
            <Text style={styles.tipLabel}>오늘의 한 줄 팁</Text>
            <Text style={styles.tipText}>{getTodayTip()}</Text>
          </View>
        </View>

        <GuideList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 20
  },
  headerCard: {
    minHeight: 126,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF7F2",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden"
  },
  mascot: {
    width: 88,
    height: 104,
    marginRight: 8
  },
  speechBubble: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D9EEE2"
  },
  tipLabel: {
    color: "#12B76A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5
  },
  tipText: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 19
  }
});
