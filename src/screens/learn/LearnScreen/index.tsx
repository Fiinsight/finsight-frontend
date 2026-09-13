import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DailyTips } from "./DailyTips";
import { GuideList } from "./GuideList";

export function LearnScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>학습 자료</Text>
          <Text style={styles.subtitle}>투자 지식을 쌓아보세요</Text>
        </View>

        <GuideList />
        <DailyTips />
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
  header: {
    gap: 4
  },
  title: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "800"
  },
  subtitle: {
    color: "#667085",
    fontSize: 14
  }
});
