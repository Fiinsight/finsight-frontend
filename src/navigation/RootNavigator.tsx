import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LearnScreen } from "../screens/learn/LearnScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { ChartStack } from "./ChartStack";
import { HistoryStack } from "./HistoryStack";
import { HomeStack } from "./HomeStack";
import type { RootTabParamList } from "./types";
import type { AuthSession } from "../lib/auth";

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcon: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: "home",
  ChartTab: "bar-chart",
  HistoryTab: "time",
  LearnTab: "book",
  ProfileTab: "person"
};

export function RootNavigator({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
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
      <Tab.Screen name="LearnTab" options={{ title: "학습", headerShown: true }}>
        {({ navigation }) => <LearnScreen onOpenHistory={() => navigation.navigate("HistoryTab")} />}
      </Tab.Screen>
      <Tab.Screen name="ProfileTab" options={{ title: "프로필", headerShown: true }}>
        {() => <ProfileScreen session={session} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
