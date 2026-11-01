// A public liveness probe is independent of authenticated API retries.
export async function probeLiveness(apiBaseUrl: string, signal: AbortSignal): Promise<number> {
  const started=Date.now();
  const response=await fetch(`${apiBaseUrl.replace(/\/api\/?$/, "")}/actuator/health/liveness`, {signal});
  if(!response.ok) throw new Error("Liveness unavailable");
  return Date.now()-started;
}
export function waitMessage(health: "pending"|"slow"|"ready"|"failed"): string {
  return health==="pending"||health==="slow" ? "서버를 깨우는 중(최대 1분)" : health==="failed" ? "서버 연결을 확인하지 못했어요. 다시 시도해 주세요." : "요청이 지연되고 있어요. 다시 시도하거나 취소할 수 있어요.";
}
