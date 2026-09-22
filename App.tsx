import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/onboarding/OnboardingScreen";
import { AuthScreen } from "./src/screens/auth/AuthScreen";
import { loadAuthSession } from "./src/lib/auth";

const queryClient = new QueryClient();

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 900);
    AsyncStorage.getItem("finsight.onboarding.completed")
      .then((value) => setHasSeenOnboarding(value === "true"))
      .catch(() => setHasSeenOnboarding(false));
    loadAuthSession().then((session) => setIsAuthenticated(Boolean(session))).catch(() => setIsAuthenticated(false));
    return () => clearTimeout(timer);
  }, []);

  if (showIntro || hasSeenOnboarding === null || isAuthenticated === null) {
    return (
      <View style={styles.intro}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <Text style={styles.introLogo}>FinSight</Text>
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setHasSeenOnboarding(true);
          void AsyncStorage.setItem("finsight.onboarding.completed", "true");
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  intro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F7F5EF"
  },
  introLogo: {
    color: "#14284B",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#DDF3E8",
    opacity: 0.8
  },
  glowBottom: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#E3ECFA",
    opacity: 0.9
  }
});
