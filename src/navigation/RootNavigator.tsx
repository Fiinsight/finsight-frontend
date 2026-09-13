import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LearnScreen } from "../screens/learn/LearnScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { ChartStack } from "./ChartStack";
import { HistoryStack } from "./HistoryStack";
import { HomeStack } from "./HomeStack";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcon: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: "home",
  ChartTab: "bar-chart",
  HistoryTab: "time",
  LearnTab: "book",
  ProfileTab: "person"
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#175CD3",
        tabBarInactiveTintColor: "#98A2B3",
        tabBarIcon: ({ color, size }) => <Ionicons name={tabIcon[route.name as keyof RootTabParamList]} size={size} color={color} />
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "홈" }} />
      <Tab.Screen name="ChartTab" component={ChartStack} options={{ title: "AI차트" }} />
      <Tab.Screen name="HistoryTab" component={HistoryStack} options={{ title: "기록" }} />
      <Tab.Screen name="LearnTab" component={LearnScreen} options={{ title: "학습", headerShown: true }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "프로필", headerShown: true }} />
    </Tab.Navigator>
  );
}
