import { create } from "zustand";
import { storageGetItem, storageSetItem } from "./storage";

const KEY = "finsight.demoTouches";
export const useDemoTouches = create(() => ({ enabled: false, error: "" }));
let loading: Promise<void> | undefined;
let revision = 0;
let writes = Promise.resolve();

export function loadDemoTouches() {
  if (!loading) {
    const started = revision;
    loading = storageGetItem(KEY).then(value => {
      if (revision === started) useDemoTouches.setState({ enabled: value === "true" });
    }).catch(() => { useDemoTouches.setState({ error: "터치 표시 설정을 불러오지 못했어요." }); });
  }
  return loading;
}

export function setDemoTouches(enabled: boolean) {
  revision++;
  useDemoTouches.setState({ enabled, error: "" });
  writes = writes.then(() => storageSetItem(KEY, String(enabled))).catch(() => {
    useDemoTouches.setState({ error: "터치 표시는 바뀌었지만 설정을 저장하지 못했어요." });
  });
  return writes;
}
