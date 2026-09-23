import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { HomeStackParamList } from "../../../navigation/types";
import { HomeHeader } from "./HomeHeader";
import { MarketPanel } from "./MarketPanel";
import { NewsSection } from "./NewsSection";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#071B4A", "#0B3D91", "#1769D1"]} locations={[0, 0.52, 1]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.container}>
          <HomeHeader />
          <MarketPanel />
          <NewsSection onSelectNews={(newsId) => navigation.navigate("NewsDetail", { newsId })} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071B4A"
  },
  background: { flex: 1 },
  container: {
    padding: 20,
    gap: 18,
    paddingBottom: 28
  }
});
