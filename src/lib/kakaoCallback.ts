// Kakao authorization codes are single-use. Retain claimed codes for the life
// of the app process so duplicate deep-link events and dev-mode remounts cannot
// exchange the same code more than once.
const handledKakaoCodes = new Set<string>();

export function claimKakaoCode(code: string): boolean {
  if (handledKakaoCodes.has(code)) return false;
  handledKakaoCodes.add(code);
  return true;
}
