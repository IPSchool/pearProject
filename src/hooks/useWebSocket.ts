import { useEffect, useRef } from "react";

import { handleRealtimeMessage } from "@/lib/realtime-handlers";
import { parseWsMessage, wsBaseUrl, type WsMessage, type WsStatus } from "@/lib/websocket";
import { useAuthStore } from "@/stores/auth";
import { useRealtimeStore } from "@/stores/realtime";

export function useWebSocket(onMessage?: (msg: WsMessage) => void) {
  const logged = useAuthStore((s) => s.logged);
  const memberId = useAuthStore((s) => s.member?.id);
  const memberOrg = useAuthStore((s) => s.member?.organization_code);
  const currentOrg = useAuthStore((s) => s.currentOrganization?.code);
  const setWsStatus = useRealtimeStore((s) => s.setWsStatus);
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const base = wsBaseUrl();
    if (!base || !logged) {
      setWsStatus("idle");
      return;
    }

    setWsStatus("connecting");
    const ws = new WebSocket(base);
    socketRef.current = ws;

    const setStatus = (status: WsStatus) => setWsStatus(status);

    ws.onopen = () => {
      setStatus("open");
      const org = memberOrg || currentOrg;
      if (memberId) {
        ws.send(
          JSON.stringify({
            uid: memberId,
            organization_code: org,
          }),
        );
      }
    };
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (ev) => {
      const msg = parseWsMessage(String(ev.data));
      if (!msg) return;
      if (msg.action === "ping") return;
      handleRealtimeMessage(msg);
      onMessageRef.current?.(msg);
    };

    return () => {
      ws.close();
      socketRef.current = null;
      setStatus("idle");
    };
  }, [logged, memberId, memberOrg, currentOrg, setWsStatus]);

  const status = useRealtimeStore((s) => s.wsStatus);
  return { status, enabled: Boolean(wsBaseUrl()) };
}
