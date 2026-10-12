import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getLearningPreferences } from "../../../lib/api";
import { getDefaultLearningPreferences } from "../../../lib/learningPreferences";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import type { HomeStackParamList } from "../../../navigation/types";
import { HomeHeader } from "./HomeHeader";
import { MarketPanel } from "./MarketPanel";
import { NewsSection } from "./NewsSection";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [preferences, setPreferences] = useState(getDefaultLearningPreferences());
  useFocusEffect(useCallback(() => { let active = true; void getLearningPreferences().then(value => { if (active) setPreferences(value); }); return () => { active = false; }; }, []));
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <HomeHeader />
        <MarketPanel />
        <NewsSection preferences={preferences} onSelectNews={(newsId) => navigation.navigate("NewsDetail", { newsId })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  scroll: { backgroundColor: "#FFFFFF" },
  container: {
    padding: 20,
    gap: 18,
    paddingBottom: 28
  }
});
