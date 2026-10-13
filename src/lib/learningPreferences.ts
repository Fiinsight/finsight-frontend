export interface OnboardingAnswer {
  questionId?: string;
  question: string;
  answer: string;
}

export type LearningLevel = "beginner" | "normal" | "analyst";
export type LearningPace = "micro" | "deep" | "on-demand";
export type LearningFocus = "news" | "decision" | "market" | "reflection";

export type LearningPainPoint = "terms" | "overload" | "evidence" | "reflection";
export type GoalType = "read1" | "memo" | "reviewJudgement" | "minutes5";
export const goalTypeFor = (goal: string): GoalType => goal.includes("메모") ? "memo" : goal.includes("판단") ? "reviewJudgement" : goal.includes("5분") ? "minutes5" : "read1";

export interface LearningPreferences {
  painPoint: LearningPainPoint;
  goalType: GoalType;
  level: LearningLevel;
  pace: LearningPace;
  focus: LearningFocus;
  dailyGoal: string;
  source: "onboarding" | "local" | "default";
}

const DEFAULT_PREFERENCES: LearningPreferences = {
  painPoint: "terms",
  goalType: "read1",
  level: "beginner",
  pace: "micro",
  focus: "news",
  dailyGoal: "뉴스 하나 읽기",
  source: "default"
};

/** Map each onboarding question to only the preference it is meant to control. */
export function mapOnboardingToLearningPreferences(answers: OnboardingAnswer[]): LearningPreferences {
  const find = (id: string, fragment: string) => answers.find((item) =>
    item.questionId === id || item.question.includes(fragment)
  )?.answer ?? "";

  const experience = find("experience", "투자 여정");
  const interest = find("interest", "알고 싶은");
  const paceAnswer = find("pace", "공부 방식");
  const difficulty = find("difficulty", "어려운 점");
  const painPoint: LearningPainPoint = difficulty.includes("정보") ? "overload" : difficulty.includes("근거") ? "evidence" : difficulty.includes("기록") ? "reflection" : "terms";
  const goal = find("goal", "습관");

  const level: LearningLevel = experience.includes("직접 투자")
    ? "analyst"
    : experience.includes("조금씩")
      ? "normal"
      : "beginner";
  const pace: LearningPace = paceAnswer.includes("깊이")
    ? "deep"
    : paceAnswer.includes("궁금한") || paceAnswer.includes("정하지")
      ? "on-demand"
      : "micro";
  const focus: LearningFocus = interest.includes("판단") || goal.includes("판단")
    ? "decision"
    : interest.includes("시장")
      ? "market"
      : interest.includes("기록") || goal.includes("메모")
        ? "reflection"
        : "news";

  return { level, pace, focus, painPoint, goalType: goalTypeFor(goal), dailyGoal: goal || DEFAULT_PREFERENCES.dailyGoal, source: "onboarding" };
}

export function getDefaultLearningPreferences(): LearningPreferences {
  return DEFAULT_PREFERENCES;
}

export function evidenceCandidates(summary: string): string[] {
  return [...new Set(summary.split(/(?<=[.!?。])\s+|\n+/).map(value => value.trim()).filter(Boolean))].slice(0, 2);
}
