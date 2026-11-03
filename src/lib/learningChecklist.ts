export const LEARNING_TASK_GOALS = { read: 1, quiz: 3, review: 1 } as const;
export function learningChecklist(read: number | null, quiz: number | null, reviewed: boolean | null) {
  return [
    { id: "read", label: `기사 ${LEARNING_TASK_GOALS.read}개 읽기`, count: read, goal: LEARNING_TASK_GOALS.read, action: "기사 읽기" },
    { id: "quiz", label: `퀴즈 ${LEARNING_TASK_GOALS.quiz}개 풀기`, count: quiz, goal: LEARNING_TASK_GOALS.quiz, action: "퀴즈 풀기" },
    { id: "review", label: `다시 볼 개념 ${LEARNING_TASK_GOALS.review}개 복습`, count: reviewed === null ? null : Number(reviewed), goal: LEARNING_TASK_GOALS.review, action: "개념 복습" }
  ].map(task => ({ ...task, done: task.count !== null && task.count >= task.goal }));
}
export const conceptReviewKey = (userId: number) => `finsight.learning.concept-review.v1:${userId}`;
