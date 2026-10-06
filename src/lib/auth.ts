import { storageGetItem, storageRemoveItem, storageSetItem } from "./storage";

export const AUTH_STORAGE_KEY = "finsight.auth";

let activeAccessToken: string | null = null;

export interface AuthSession {
  accessToken: string;
  userId: number;
  email: string;
  nickname: string;
}

let authFailureHandler: (() => void) | null = null;
export function setAuthFailureHandler(handler: (() => void) | null): void { authFailureHandler = handler; }
export function notifyAuthFailure(status: number | undefined, requestToken: string | undefined): void {
  if ((status === 401 || status === 403) && activeAccessToken && requestToken === `Bearer ${activeAccessToken}`) {
    activeAccessToken = null;
    authFailureHandler?.();
  }
}

export function getActiveAccessToken(): string | null {
  return activeAccessToken;
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await storageGetItem(AUTH_STORAGE_KEY);
  if (!raw) {
    activeAccessToken = null;
    return null;
  }
  try {
    const session = JSON.parse(raw) as AuthSession;
    activeAccessToken = session.accessToken || null;
    return session;
  } catch {
    activeAccessToken = null;
    await storageRemoveItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  activeAccessToken = session.accessToken;
  await storageSetItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  activeAccessToken = null;
  await storageRemoveItem(AUTH_STORAGE_KEY);
}
