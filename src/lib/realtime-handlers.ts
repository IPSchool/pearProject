import type { WsMessage } from "@/lib/websocket";
import { useRealtimeStore } from "@/stores/realtime";

function projectCodeFromMessage(msg: WsMessage): string | null {
  const nested = msg.data as { data?: { projectCode?: string }; projectCode?: string } | undefined;
  if (!nested) return null;
  if (typeof nested.projectCode === "string") return nested.projectCode;
  if (typeof nested.data?.projectCode === "string") return nested.data.projectCode;
  return null;
}

export function handleRealtimeMessage(msg: WsMessage) {
  const action = msg.action ?? "";
  const store = useRealtimeStore.getState();

  if (action === "organization:task") {
    const projectCode = projectCodeFromMessage(msg);
    if (projectCode) store.bumpProjectTasks(projectCode);
    return;
  }

  if (action === "notice" || action === "task" || action === "events") {
    store.bumpNotify();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const title = msg.title || "PearProject";
      const body = msg.msg || msg.title || "你有新消息";
      try {
        new Notification(title, { body });
      } catch {
        // ignore notification errors
      }
    }
  }
}
