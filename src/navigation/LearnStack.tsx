import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LearnScreen } from "../screens/learn/LearnScreen";
import { NewsDetailScreen } from "../screens/home/NewsDetailScreen";
import { JudgementScreen } from "../screens/home/JudgementScreen";
import { FeedbackScreen } from "../screens/home/FeedbackScreen";
import type { LearnStackParamList } from "./types";
const Stack = createNativeStackNavigator<LearnStackParamList>();
export function LearnStack() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Learn" component={LearnScreen} options={{ title: "학습" }} />
    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "기사 상세" }} />
    <Stack.Screen name="Judgement" component={JudgementScreen} options={{ title: "판단하기" }} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "판단 완료" }} />
  </Stack.Navigator>;
}
