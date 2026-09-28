import AsyncStorage from "@react-native-async-storage/async-storage";

// Expo Go can temporarily expose the JS package before its native storage
// module is available (for example after a stale OTA/dev-client reload). Do
// not let that make the auth screen crash. Keep the app usable and fall back
// to web storage or an in-memory store until the native module is available.
const memory = new Map<string, string>();
let nativeStorageDisabled = false;

function webStorage(): Storage | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function isWeb() {
  return typeof window !== "undefined";
}

export async function storageGetItem(key: string): Promise<string | null> {
  if (isWeb()) {
    try { return webStorage()?.getItem(key) ?? memory.get(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  }
  if (!nativeStorageDisabled) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      nativeStorageDisabled = true;
    }
  }
  try {
    const browserValue = webStorage()?.getItem(key);
    return browserValue ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (isWeb()) {
    const store = webStorage();
    if (!store) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    try {
      store.setItem(key, value);
      memory.set(key, value);
      return;
    } catch {
      throw new Error("로그인 세션을 브라우저에 저장할 수 없습니다.");
    }
  }
  if (!nativeStorageDisabled) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      nativeStorageDisabled = true;
    }
  }
  try {
    webStorage()?.setItem(key, value);
  } catch {
    // Some private/native runtimes expose localStorage but reject writes.
  }
  memory.set(key, value);
}

export async function storageRemoveItem(key: string): Promise<void> {
  if (isWeb()) {
    try { webStorage()?.removeItem(key); } catch { /* clear memory below */ }
    memory.delete(key);
    return;
  }
  if (!nativeStorageDisabled) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      nativeStorageDisabled = true;
    }
  }
  try {
    webStorage()?.removeItem(key);
  } catch {
    // Ignore unavailable browser storage and clear the in-memory copy below.
  }
  memory.delete(key);
}
