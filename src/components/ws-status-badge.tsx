import clsx from "clsx";

import { wsBaseUrl } from "@/lib/websocket";
import { useRealtimeStore } from "@/stores/realtime";

const labels: Record<string, string> = {
  idle: "实时未配置",
  connecting: "连接中…",
  open: "实时已连接",
  closed: "实时已断开",
  error: "实时异常",
};

const dotClass: Record<string, string> = {
  idle: "bg-subtlest",
  connecting: "bg-warning animate-pulse",
  open: "bg-success",
  closed: "bg-subtlest",
  error: "bg-danger",
};

export function WsStatusBadge({ compact = false }: { compact?: boolean }) {
  const status = useRealtimeStore((s) => s.wsStatus);
  const enabled = Boolean(wsBaseUrl());
  const key = enabled ? status : "idle";
  const label = labels[key] ?? status;

  if (compact) {
    return (
      <span
        className="inline-flex size-9 items-center justify-center"
        title={label}
      >
        <span
          className={clsx("size-2 rounded-full", dotClass[key] ?? "bg-subtlest")}
        />
      </span>
    );
  }

  return (
    <span className="type-body-small text-subtle">{label}</span>
  );
}
