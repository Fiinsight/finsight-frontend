import { colors, spacing } from "../../../theme";
import { useJudgementResults } from "../../../components/JudgementResultsProvider";
import { JudgementResultBanner } from "../../../components/JudgementResultBanner";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getWatchlist, getWatchlistNews } from "../../../lib/api";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import type { HomeStackParamList } from "../../../navigation/types";
import { HomeHeader } from "./HomeHeader";
import { MarketPanel } from "./MarketPanel";
import { NewsSection } from "./NewsSection";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const {unseen,pending,refresh}=useJudgementResults();
  useFocusEffect(useCallback(()=>{refresh();},[refresh]));
  const result=unseen[0] ?? pending;
  const watchlist=useQuery({queryKey:["watchlist"],queryFn:getWatchlist,retry:0});
  const watchedNews=useQuery({queryKey:["watchlist-news",watchlist.data?.map(item=>item.symbol).join(",")],queryFn:getWatchlistNews,enabled:!!watchlist.data?.length,retry:0});
  const watchlistFailed=watchlist.isError || watchedNews.isError;
  const watchedItems=watchlist.data?.length && !watchlistFailed ? watchedNews.data ?? [] : [];
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <HomeHeader />
        {result ? <JudgementResultBanner item={result} pending={!unseen.length} onPress={() => navigation.getParent()?.navigate("HistoryTab", {screen:"JudgementDetail",params:{item:result}})} /> : null}
        <MarketPanel />
        <NewsSection watchedNews={watchedItems} onSelectNews={(newsId) => navigation.navigate("NewsDetail", { newsId })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scroll: { backgroundColor: colors.surface },
  container: {
    padding: spacing.lg,
    gap: 18,
    paddingBottom: 28
  }
});
