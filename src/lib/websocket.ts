/** Optional WebSocket URL; empty = realtime disabled (docker/jira 默认未启 GatewayWorker). */
export function wsBaseUrl(): string | null {
  const raw = import.meta.env.VITE_WS_URL as string | undefined;
  if (!raw?.trim()) return null;
  return raw.trim().replace(/\/$/, "");
}

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface WsMessage {
  action?: string;
  data?: unknown;
}

export function parseWsMessage(raw: string): WsMessage | null {
  try {
    return JSON.parse(raw) as WsMessage;
  } catch {
    return null;
  }
}
