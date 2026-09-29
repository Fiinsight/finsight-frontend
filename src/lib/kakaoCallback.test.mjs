import test from "node:test";
import assert from "node:assert/strict";
import { claimKakaoCode } from "./kakaoCallback.ts";

test("a Kakao authorization code is claimed only once", () => {
  const code = "single-use-code";
  assert.equal(claimKakaoCode(code), true);
  assert.equal(claimKakaoCode(code), false);
});

test("a new Kakao authorization code can be claimed", () => {
  assert.equal(claimKakaoCode("different-single-use-code"), true);
});
