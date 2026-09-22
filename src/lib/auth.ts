import AsyncStorage from "@react-native-async-storage/async-storage";

export const AUTH_STORAGE_KEY = "finsight.auth";

export interface AuthSession {
  accessToken: string;
  userId: number;
  email: string;
  nickname: string;
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}
