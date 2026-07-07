import { useWebSocket } from "@/hooks/useWebSocket";

/** 登录后维持 WebSocket 连接（全局单例挂载点） */
export function AppRealtimeBootstrap() {
  useWebSocket();
  return null;
}
