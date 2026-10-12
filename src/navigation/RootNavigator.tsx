import type { ReactNode } from "react";
import { View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { PlatformPressable } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LearnStack } from "./LearnStack";
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
  ChartTab: "bar-chart-outline",
  HistoryTab: "time-outline",
  LearnTab: "book-outline",
  ProfileTab: "person-outline"
};

function AccessibleTab({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  return <View style={{ flex: 1 }} accessibilityElementsHidden={!focused} importantForAccessibility={focused ? "auto" : "no-hide-descendants"} aria-hidden={!focused}>{children}</View>;
}

export function RootNavigator({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: (props) => <PlatformPressable {...props} href={({ HomeTab: "/", ChartTab: "/chart", HistoryTab: "/history", LearnTab: "/learn", ProfileTab: "/profile" })[route.name]} />,
        tabBarAccessibilityLabel: ({ HomeTab: "홈", ChartTab: "차트", HistoryTab: "기록", LearnTab: "학습", ProfileTab: "프로필" })[route.name],
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
      <Tab.Screen name="HomeTab" options={{ title: "홈" }}>{() => <AccessibleTab><HomeStack /></AccessibleTab>}</Tab.Screen>
      <Tab.Screen name="ChartTab" options={{ title: "차트" }}>{() => <AccessibleTab><ChartStack /></AccessibleTab>}</Tab.Screen>
      <Tab.Screen name="HistoryTab" options={{ title: "기록" }}>{() => <AccessibleTab><HistoryStack /></AccessibleTab>}</Tab.Screen>
      <Tab.Screen name="LearnTab" options={{ title: "학습" }}>{() => <AccessibleTab><LearnStack /></AccessibleTab>}</Tab.Screen>
      <Tab.Screen name="ProfileTab" options={{ title: "프로필" }}>
        {() => <AccessibleTab><ProfileScreen session={session} onLogout={onLogout} /></AccessibleTab>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
