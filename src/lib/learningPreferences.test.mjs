import assert from "node:assert/strict";
import test from "node:test";
import { mapOnboardingToLearningPreferences } from "./learningPreferences.ts";

const answer = (questionId, question, value) => ({ questionId, question, answer: value });

test("experience, pace, interest, and goal control separate learning settings", () => {
  const result = mapOnboardingToLearningPreferences([
    answer("experience", "지금 투자 여정을 어디쯤 걷고 있나요?", "이제 막 시작했어요"),
    answer("interest", "투자할 때 가장 알고 싶은 것은 무엇인가요?", "시장 흐름을 읽고 싶어요"),
    answer("pace", "나에게 맞는 투자 공부 방식은 어떤 모습인가요?", "한 번에 깊이 있게"),
    answer("difficulty", "투자 소식을 접할 때 가장 어려운 점은 무엇인가요?", "판단할 근거가 부족해요"),
    answer("goal", "오늘 어떤 습관을 시작해볼까요?", "뉴스 하나 읽기")
  ]);

  assert.equal(result.level, "beginner");
  assert.equal(result.pace, "deep");
  assert.equal(result.focus, "market");
});

test("memo and reflection choices select review-focused learning", () => {
  const result = mapOnboardingToLearningPreferences([
    answer("experience", "투자 여정", "조금씩 알아가고 있어요"),
    answer("interest", "알고 싶은 것", "내 투자 기록을 돌아보고 싶어요"),
    answer("pace", "공부 방식", "궁금한 것부터 자유롭게"),
    answer("goal", "습관", "기사 메모 남기고 복습하기")
  ]);

  assert.equal(result.level, "normal");
  assert.equal(result.pace, "on-demand");
  assert.equal(result.focus, "reflection");
  assert.equal(result.dailyGoal, "기사 메모 남기고 복습하기");
});

test("goal can select decision practice while difficulty cannot override experience", () => {
  const result = mapOnboardingToLearningPreferences([
    answer("experience", "투자 여정", "아직 잘 모르겠어요"),
    answer("interest", "알고 싶은 것", "뉴스 내용을 쉽게 이해하고 싶어요"),
    answer("difficulty", "어려운 점", "판단할 근거가 부족해요"),
    answer("goal", "습관", "투자 판단 돌아보기")
  ]);

  assert.equal(result.level, "beginner");
  assert.equal(result.focus, "decision");
});
