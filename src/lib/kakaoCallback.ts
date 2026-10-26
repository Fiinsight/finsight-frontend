// Kakao authorization codes are single-use. Retain claimed codes for the life
// of the app process so duplicate deep-link events and dev-mode remounts cannot
// exchange the same code more than once.
const handledKakaoCodes = new Set<string>();

export function claimKakaoCode(code: string): boolean {
  if (handledKakaoCodes.has(code)) return false;
  handledKakaoCodes.add(code);
  return true;
}

// OAuth returns in a fresh page, before the guest has dismissed onboarding.
export function isKakaoWebCallback(url?: string): boolean {
  if (!url) return false;
  try {
    const callback = new URL(url);
    return callback.pathname === "/auth/kakao"
      && (callback.searchParams.has("code") || callback.searchParams.has("error"));
  } catch { return false; }
}
