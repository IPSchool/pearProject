import { useEffect, useRef, useState } from "react";

import { parseWsMessage, wsBaseUrl, type WsMessage, type WsStatus } from "@/lib/websocket";
import { useAuthStore } from "@/stores/auth";

export function useWebSocket(onMessage?: (msg: WsMessage) => void) {
  const token = useAuthStore((s) => s.tokenList?.accessToken);
  const [status, setStatus] = useState<WsStatus>("idle");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const base = wsBaseUrl();
    if (!base || !token) {
      setStatus("idle");
      return;
    }

    const url = `${base}?token=${encodeURIComponent(token)}`;
    setStatus("connecting");
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (ev) => {
      const msg = parseWsMessage(String(ev.data));
      if (msg && onMessage) onMessage(msg);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [token, onMessage]);

  return { status, enabled: Boolean(wsBaseUrl()) };
}
