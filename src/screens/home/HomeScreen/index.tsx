import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import type { HomeStackParamList } from "../../../navigation/types";
import { HomeHeader } from "./HomeHeader";
import { MarketPanel } from "./MarketPanel";
import { NewsSection } from "./NewsSection";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const nearBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 400;
          if (nearBottom) void loadMoreRef.current?.();
        }}
      >
        <HomeHeader />
        <MarketPanel />
        <NewsSection loadMoreRef={loadMoreRef} onSelectNews={(newsId) => navigation.navigate("NewsDetail", { newsId })} />
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
