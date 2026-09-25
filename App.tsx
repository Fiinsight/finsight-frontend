import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/onboarding/OnboardingScreen";
import { AuthScreen } from "./src/screens/auth/AuthScreen";
import { clearAuthSession, loadAuthSession, type AuthSession } from "./src/lib/auth";
import { clearOnboardingProfile, saveOnboardingProfile } from "./src/lib/onboarding";
import { syncOnboardingProfile } from "./src/lib/api";

const queryClient = new QueryClient();
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [onboardingDoneThisRun, setOnboardingDoneThisRun] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 900);
    loadAuthSession().then(setSession).catch(() => setSession(null)).finally(() => setSessionLoaded(true));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    void syncOnboardingProfile().catch(() => {
      // The local profile remains available and can be retried on the next launch.
    });
  }, [session]);

  if (showIntro || !sessionLoaded) {
    return (
      <View style={styles.intro}>
        <Text style={styles.introLogo}>FinSight</Text>
      </View>
    );
  }

  // An authenticated user has already completed the account entry flow and
  // should go straight to the app. A guest sees onboarding on each fresh app
  // launch until they sign in, so dismissing onboarding is never treated as
  // permanent account completion.
  if (!session && !onboardingDoneThisRun) {
    return (
      <OnboardingScreen
        onComplete={(answers) => {
          setOnboardingDoneThisRun(true);
          void saveOnboardingProfile(answers);
        }}
      />
    );
  }

  if (!session) {
    return <AuthScreen onAuthenticated={() => void loadAuthSession().then(setSession)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator
          session={session}
          onLogout={() =>
            void clearAuthSession()
              .then(clearOnboardingProfile)
              .then(() => {
                queryClient.clear();
                setOnboardingDoneThisRun(false);
                setSession(null);
              })
          }
        />
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
