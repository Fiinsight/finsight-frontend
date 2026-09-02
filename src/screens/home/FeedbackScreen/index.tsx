import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { BottomActionBar } from "../../../components/BottomActionBar";
import { ScreenTopBar } from "../../../components/ScreenTopBar";
import type { NewsFlowParamList } from "../../../navigation/types";
import { FeedbackChart } from "./FeedbackChart";
import { ReasonsCard } from "./ReasonsCard";
import { ResultBanner } from "./ResultBanner";

type Props = NativeStackScreenProps<NewsFlowParamList, "Feedback">;

export function FeedbackScreen({ route, navigation }: Props) {
  const { feedback } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTopBar title="차트 분석" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <ResultBanner aligned={feedback.aligned} actualChangePercent={feedback.actualChangePercent} symbolName={feedback.relatedSymbolName} />
        <ReasonsCard aligned={feedback.aligned} reasons={feedback.reasons} />
        <FeedbackChart symbolName={feedback.relatedSymbolName} points={feedback.chart} />
      </ScrollView>

      <BottomActionBar label="완료" onPress={() => navigation.popToTop()} />
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
    gap: 16
  }
});
