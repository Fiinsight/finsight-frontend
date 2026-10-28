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

// Keep development diagnostics limited to non-sensitive transport metadata.
export function kakaoFailureDetail(error: unknown, stage: "prepare" | "foreground" | "connection" | "exchange" | "storage"): string {
  const failure = error as { response?: { status?: unknown }; code?: unknown } | null;
  const status = failure?.response?.status;
  const code = failure?.code;
  const safeCode = typeof code === "string" && /^(?:ERR_[A-Z_]+|ECONNABORTED|ETIMEDOUT)$/.test(code) ? code : "UNKNOWN";
  return `${stage} / HTTP ${typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : "NONE"} / ${safeCode}`;
}

interface KakaoAppState {
  currentState: string | null | undefined;
  addEventListener(event: "change", listener: (state: string) => void): { remove(): void };
}

export function waitForKakaoForeground(appState: KakaoAppState): Promise<void> {
  if (appState.currentState === "active") return Promise.resolve();
  return new Promise((resolve, reject) => {
    let subscription: { remove(): void } | undefined;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(Object.assign(new Error("App did not return to foreground"), { code: "ERR_APP_NOT_ACTIVE" })), 10000);
    subscription = appState.addEventListener("change", state => { if (state === "active") finish(); });
    if (settled) subscription.remove();
    else if (appState.currentState === "active") finish();
  });
}

// Only the read-only connectivity probe can retry. OAuth codes remain single-use.
export async function checkKakaoConnection(probe: () => Promise<unknown>): Promise<void> {
  try { await probe(); }
  catch (error) {
    if ((error as { code?: string })?.code !== "ERR_NETWORK") throw error;
    await probe();
  }
}
