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
import { saveOnboardingProfile } from "./src/lib/onboarding";

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
        <Text style={styles.introLogo}>FinSight</Text>
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <OnboardingScreen
        onComplete={(answers) => {
          setHasSeenOnboarding(true);
          void AsyncStorage.setItem("finsight.onboarding.completed", "true");
          void saveOnboardingProfile(answers);
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
    backgroundColor: "#168DF2"
  },
  introLogo: {
    color: "#FFFFFF",
    fontFamily: "Avenir Next",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4
  }
});
