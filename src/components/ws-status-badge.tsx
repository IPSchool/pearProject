import { Chip } from "@heroui/react";

import { useWebSocket } from "@/hooks/useWebSocket";

const labels: Record<string, string> = {
  idle: "实时未配置",
  connecting: "连接中…",
  open: "实时已连接",
  closed: "实时已断开",
  error: "实时异常",
};

const variants: Record<string, "soft" | "primary" | "secondary" | "tertiary"> = {
  idle: "tertiary",
  connecting: "secondary",
  open: "primary",
  closed: "tertiary",
  error: "soft",
};

export function WsStatusBadge() {
  const { status, enabled } = useWebSocket();

  if (!enabled) {
    return (
      <Chip size="sm" variant="tertiary">
        {labels.idle}
      </Chip>
    );
  }

  return (
    <Chip size="sm" variant={variants[status] ?? "tertiary"}>
      {labels[status] ?? status}
    </Chip>
  );
}
