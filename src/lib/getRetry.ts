import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & { finsightGetRetried?: boolean };

function waitForRetry(signal: InternalAxiosRequestConfig["signal"]): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", cancel);
      reject(new axios.CanceledError("Request cancelled before retry"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener?.("abort", cancel);
      resolve();
    }, 750);
    if (signal?.aborted) cancel();
    else signal?.addEventListener?.("abort", cancel);
  });
}

export function installSafeGetRetry(client: AxiosInstance, delay = waitForRetry): void {
  client.interceptors.response.use(response => response, async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const config = error.config as RetryConfig | undefined;
    const transient = error.response
      ? error.response.status === 502 || error.response.status === 503
      : ["ERR_NETWORK", "ECONNRESET", "ECONNABORTED", "ETIMEDOUT"].includes(error.code ?? "");
    if (config?.method?.toLowerCase() !== "get" || config.finsightGetRetried
      || config.signal?.aborted || axios.isCancel(error) || !transient) throw error;
    config.finsightGetRetried = true;
    await delay(config.signal);
    return client.request(config);
  });
}
