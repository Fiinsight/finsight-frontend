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
      <Stack.Screen name="Chart" component={ChartScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="Judgement" component={JudgementScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
