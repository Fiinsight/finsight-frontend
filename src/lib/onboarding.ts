import { loadAuthSession } from "./auth";
import { storageGetItem, storageRemoveItem, storageSetItem } from "./storage";
import { mapOnboardingToLearningPreferences } from "./learningPreferences";
import type { OnboardingAnswer } from "./learningPreferences";

export { getDefaultLearningPreferences, mapOnboardingToLearningPreferences } from "./learningPreferences";
export type { LearningFocus, LearningLevel, LearningPace, LearningPreferences, OnboardingAnswer } from "./learningPreferences";

export const ONBOARDING_PROFILE_KEY = "finsight.onboarding.profile";

export interface OnboardingProfile {
  userId?: number;
  answers: OnboardingAnswer[];
  completedAt: string;
}

export async function saveOnboardingProfile(answers: OnboardingAnswer[]): Promise<void> {
  const session = await loadAuthSession();
  const profile: OnboardingProfile = { userId: session?.userId, answers, completedAt: new Date().toISOString() };
  await storageSetItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
}

export async function loadOnboardingProfile(includePending = false): Promise<OnboardingProfile | null> {
  const raw = await storageGetItem(ONBOARDING_PROFILE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as OnboardingProfile;
    const session = await loadAuthSession();
    if (session && profile.userId !== session.userId && !(includePending && profile.userId == null)) return null;
    if (!session && profile.userId != null) return null;
    return profile;
  } catch {
    await storageRemoveItem(ONBOARDING_PROFILE_KEY);
    return null;
  }
}

/** Remove device-local onboarding data when the account signs out. */
export async function clearOnboardingProfile(): Promise<void> {
  await storageRemoveItem(ONBOARDING_PROFILE_KEY);
}
