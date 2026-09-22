import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_PROFILE_KEY = "finsight.onboarding.profile";

export interface OnboardingAnswer {
  questionId?: string;
  question: string;
  answer: string;
}

export interface OnboardingProfile {
  answers: OnboardingAnswer[];
  completedAt: string;
}

export type LearningLevel = "beginner" | "normal" | "analyst";
export type LearningPace = "micro" | "deep" | "on-demand";
export type LearningFocus = "news" | "decision" | "market" | "reflection";

export interface LearningPreferences {
  level: LearningLevel;
  pace: LearningPace;
  focus: LearningFocus;
  dailyGoal: string;
  source: "onboarding" | "default";
}

const DEFAULT_PREFERENCES: LearningPreferences = {
  level: "beginner",
  pace: "micro",
  focus: "news",
  dailyGoal: "뉴스 하나 읽기",
  source: "default"
};

/** Convert the onboarding answers into stable product settings. */
export function mapOnboardingToLearningPreferences(answers: OnboardingAnswer[]): LearningPreferences {
  const find = (id: string, fragment: string) => answers.find((item) => item.questionId === id || item.question.includes(fragment))?.answer ?? "";
  const experience = find("experience", "투자 여정");
  const interest = find("interest", "알고 싶은");
  const paceAnswer = find("pace", "공부 방식");
  const difficulty = find("difficulty", "어려운 점");
  const goal = find("goal", "습관");

  const level: LearningLevel = experience.includes("직접 투자") || interest.includes("시장 흐름") || difficulty.includes("근거")
    ? "analyst"
    : experience.includes("조금씩") || interest.includes("판단") || difficulty.includes("정보")
      ? "normal"
      : "beginner";

  const pace: LearningPace = paceAnswer.includes("깊이") ? "deep" : paceAnswer.includes("궁금한") ? "on-demand" : "micro";
  const focus: LearningFocus = interest.includes("판단") || goal.includes("판단")
    ? "decision"
    : interest.includes("시장")
      ? "market"
      : interest.includes("기록") || goal.includes("생각")
        ? "reflection"
        : "news";

  return { level, pace, focus, dailyGoal: goal || DEFAULT_PREFERENCES.dailyGoal, source: "onboarding" };
}

export function getDefaultLearningPreferences(): LearningPreferences {
  return DEFAULT_PREFERENCES;
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
