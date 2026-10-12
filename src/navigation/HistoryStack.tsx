import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FeedbackScreen } from "../screens/home/FeedbackScreen";
import { JudgementScreen } from "../screens/home/JudgementScreen";
import { NewsDetailScreen } from "../screens/home/NewsDetailScreen";
import { HistoryScreen } from "../screens/history/HistoryScreen";
import { JudgementDetailScreen } from "../screens/history/JudgementDetailScreen";
import type { HistoryStackParamList } from "./types";

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: "기록" }} />
      <Stack.Screen name="JudgementDetail" component={JudgementDetailScreen} options={{ title: "판단 기록" }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "기사 상세" }} />
      <Stack.Screen name="Judgement" component={JudgementScreen} options={{ title: "판단하기" }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "판단 완료" }} />
    </Stack.Navigator>
  );
}
