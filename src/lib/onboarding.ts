import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_PROFILE_KEY = "finsight.onboarding.profile";

export interface OnboardingAnswer {
  question: string;
  answer: string;
}

export interface OnboardingProfile {
  answers: OnboardingAnswer[];
  completedAt: string;
}

export async function saveOnboardingProfile(answers: OnboardingAnswer[]): Promise<void> {
  const profile: OnboardingProfile = { answers, completedAt: new Date().toISOString() };
  await AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
}

export async function loadOnboardingProfile(): Promise<OnboardingProfile | null> {
  const raw = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingProfile;
  } catch {
    await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
    return null;
  }
}
