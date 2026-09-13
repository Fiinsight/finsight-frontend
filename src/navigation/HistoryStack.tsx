import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FeedbackScreen } from "../screens/home/FeedbackScreen";
import { JudgementScreen } from "../screens/home/JudgementScreen";
import { NewsDetailScreen } from "../screens/home/NewsDetailScreen";
import { HistoryScreen } from "../screens/history/HistoryScreen";
import type { HistoryStackParamList } from "./types";

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="Judgement" component={JudgementScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
