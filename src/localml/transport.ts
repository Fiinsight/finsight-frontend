import { api } from "../lib/api";
import type { LocalMlQuery, LocalMlResult, LocalMlTransport } from "./LocalMlPanel";

export const searchLocalMl: LocalMlTransport = async (payload: LocalMlQuery): Promise<LocalMlResult> => {
  const response = await api.post<LocalMlResult>("/local-ml/search", payload, { timeout: 10000 });
  return response.data;
};
