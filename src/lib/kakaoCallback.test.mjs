import test from "node:test";
import assert from "node:assert/strict";
import { claimKakaoCode, isKakaoWebCallback } from "./kakaoCallback.ts";

test("a Kakao authorization code is claimed only once", () => {
  const code = "single-use-code";
  assert.equal(claimKakaoCode(code), true);
  assert.equal(claimKakaoCode(code), false);
});

test("a new Kakao authorization code can be claimed", () => {
  assert.equal(claimKakaoCode("different-single-use-code"), true);
});

test("a fresh OAuth page bypasses guest onboarding for success and cancellation", () => {
  assert.equal(isKakaoWebCallback("https://app.expo.app/auth/kakao?code=one-use"), true);
  assert.equal(isKakaoWebCallback("https://app.expo.app/auth/kakao?error=access_denied"), true);
  assert.equal(isKakaoWebCallback("https://app.expo.app/?code=unrelated"), false);
  assert.equal(isKakaoWebCallback("https://app.expo.app/auth/kakao"), false);
  assert.equal(isKakaoWebCallback(undefined), false);
  assert.equal(isKakaoWebCallback("invalid"), false);
});
