import test from "node:test";
import assert from "node:assert/strict";
import { claimKakaoCode, isKakaoWebCallback, kakaoFailureDetail, waitForKakaoForeground, checkKakaoConnection } from "./kakaoCallback.ts";

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

test("Kakao diagnostics distinguish exchange/storage without disclosing credentials", () => {
  const failure = { code: "ERR_NETWORK", message: "secret-code", config: { headers: { Authorization: "secret-token" } } };
  assert.equal(kakaoFailureDetail(failure, "exchange"), "exchange / HTTP NONE / ERR_NETWORK");
  assert.equal(kakaoFailureDetail({response:{status:502},code:"ERR_BAD_RESPONSE"}, "exchange"), "exchange / HTTP 502 / ERR_BAD_RESPONSE");
  assert.equal(kakaoFailureDetail(new Error("secret-user-data"), "storage"), "storage / HTTP NONE / UNKNOWN");
  assert.equal(kakaoFailureDetail({code:"secret-token",response:{status:"secret-code"}}, "exchange"), "exchange / HTTP NONE / UNKNOWN");
});

test("native callback waits for foreground before a single code exchange", async () => {
  let listener, removed=0, probes=0, exchanges=0;
  const app={currentState:"inactive",addEventListener(event,fn){listener=fn;return{remove(){removed++}}}};
  const pending=(async()=>{await waitForKakaoForeground(app);await checkKakaoConnection(async()=>{probes++;if(probes===1)throw{code:"ERR_NETWORK"}});exchanges++})();
  await Promise.resolve();assert.equal(probes,0);assert.equal(exchanges,0);
  listener("background");await Promise.resolve();assert.equal(probes,0);
  listener("active");await pending;
  assert.equal(removed,1);assert.equal(probes,2);assert.equal(exchanges,1);
});
test("foreground connectivity errors are bounded and HTTP rejections are not retried",async()=>{
  await waitForKakaoForeground({currentState:"active",addEventListener(){throw Error("Should not subscribe")}});
  let probes=0;
  await assert.rejects(checkKakaoConnection(async()=>{probes++;throw{code:"ERR_NETWORK"}}));assert.equal(probes,2);
  probes=0;
  await assert.rejects(checkKakaoConnection(async()=>{probes++;throw{response:{status:503}}}));assert.equal(probes,1);
});
