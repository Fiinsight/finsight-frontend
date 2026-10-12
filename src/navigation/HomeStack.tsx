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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "홈" }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "기사 상세" }} />
      <Stack.Screen name="Judgement" component={JudgementScreen} options={{ title: "판단하기" }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "판단 완료" }} />
    </Stack.Navigator>
  );
}
