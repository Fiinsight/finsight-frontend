import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FeedbackScreen } from "../screens/home/FeedbackScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { JudgementScreen } from "../screens/home/JudgementScreen";
import { NewsDetailScreen } from "../screens/home/NewsDetailScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <Stack.Screen name="Judgement" component={JudgementScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
