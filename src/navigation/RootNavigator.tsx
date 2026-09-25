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

const inactiveTabIcon: Partial<Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap>> = {
  HomeTab: "home-outline",
  ProfileTab: "person-outline"
};

export function RootNavigator({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#202124",
        tabBarInactiveTintColor: "#C7C9CE",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500"
        },
        tabBarIcon: ({ color, focused, size }) => {
          const routeName = route.name as keyof RootTabParamList;
          const name = !focused && inactiveTabIcon[routeName]
            ? inactiveTabIcon[routeName]
            : tabIcon[routeName];
          return <Ionicons name={name} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "홈" }} />
      <Tab.Screen name="ChartTab" component={ChartStack} options={{ title: "차트" }} />
      <Tab.Screen name="HistoryTab" component={HistoryStack} options={{ title: "기록" }} />
      <Tab.Screen name="LearnTab" component={LearnScreen} options={{ title: "학습", headerShown: true }} />
      <Tab.Screen name="ProfileTab" options={{ title: "프로필", headerShown: true }}>
        {() => <ProfileScreen session={session} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
