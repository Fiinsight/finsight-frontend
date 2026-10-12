import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChartScreen } from "../screens/chart/ChartScreen";
import { FeedbackScreen } from "../screens/home/FeedbackScreen";
import { JudgementScreen } from "../screens/home/JudgementScreen";
import { NewsDetailScreen } from "../screens/home/NewsDetailScreen";
import type { ChartStackParamList } from "./types";

const Stack = createNativeStackNavigator<ChartStackParamList>();

export function ChartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chart" component={ChartScreen} options={{ title: "차트" }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "기사 상세" }} />
      <Stack.Screen name="Judgement" component={JudgementScreen} options={{ title: "판단하기" }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "판단 완료" }} />
    </Stack.Navigator>
  );
}
