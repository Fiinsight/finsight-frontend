import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/onboarding/OnboardingScreen";
import { AuthScreen } from "./src/screens/auth/AuthScreen";
import { clearAuthSession, loadAuthSession, saveAuthSession, type AuthSession } from "./src/lib/auth";
import { clearOnboardingProfile, loadOnboardingProfile, saveOnboardingProfile } from "./src/lib/onboarding";
import { getCurrentUser, syncOnboardingProfile } from "./src/lib/api";
import { useAppStore } from "./src/store/useAppStore";

function isAuthFailure(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } }
});
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [onboardingDoneThisRun, setOnboardingDoneThisRun] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const handleLogout = async () => {
    // Always leave the authenticated tree even if one storage backend rejects
    // a cleanup call; clear each independent cache without short-circuiting.
    await Promise.allSettled([clearAuthSession(), clearOnboardingProfile()]);
    queryClient.clear();
    useAppStore.getState().resetForLogout();
    setOnboardingDoneThisRun(false);
    setSession(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 900);
    Promise.all([loadAuthSession(), loadOnboardingProfile()])
      .then(async ([storedSession, onboardingProfile]) => {
        // Older Kakao sessions stored a synthetic local email. Refresh them
        // once from the backend so newly consented profile data is reflected.
        const needsKakaoProfileRefresh = storedSession?.email.endsWith("@kakao.local") ?? false;
        if (needsKakaoProfileRefresh) {
          try {
            const refreshedSession = await getCurrentUser();
            // A user may decline optional Kakao profile scopes. That is not an
            // authentication failure: keep the valid session and its fallback.
            await saveAuthSession(refreshedSession);
            setSession(refreshedSession);
          } catch (error) {
            // Keep a valid stored session through temporary backend/network
            // failures. Only an explicit auth rejection should log the user out.
            if (isAuthFailure(error)) {
              await clearAuthSession();
              setSession(null);
            } else {
              setSession(storedSession);
            }
          }
        } else {
          setSession(storedSession);
        }
        setOnboardingDoneThisRun(Boolean(onboardingProfile));
      })
      .catch(() => {
        setSession(null);
        setOnboardingDoneThisRun(false);
      })
      .finally(() => setSessionLoaded(true));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    void syncOnboardingProfile(onboardingDoneThisRun).catch(() => {
      // The local profile remains available and can be retried on the next launch.
    });
  }, [session]);

  if (showIntro || !sessionLoaded) {
    return (
      <LinearGradient colors={["#071B4A", "#0B3D91", "#1769D1"]} locations={[0, 0.52, 1]} style={styles.intro}>
        <Text style={styles.introTagline}>흩어지는 뉴스 속, 나만의 투자 인사이트</Text>
        <Text style={styles.introLogo}>FinSight</Text>
      </LinearGradient>
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
          onLogout={() => { void handleLogout(); }}
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
    overflow: "hidden"
  },
  introLogo: {
    color: "#FFFFFF",
    fontFamily: "Avenir Next",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4
  },
  introTagline: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Avenir Next",
    fontSize: 16,
    letterSpacing: 0.2,
    marginBottom: 8
  }
});
