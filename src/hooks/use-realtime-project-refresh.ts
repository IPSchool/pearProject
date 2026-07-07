import { useEffect } from "react";

import { useRealtimeStore } from "@/stores/realtime";

/** 订阅组织内任务变更，触发 reload */
export function useRealtimeProjectRefresh(projectCode: string, reload: () => void | Promise<void>) {
  const tick = useRealtimeStore((s) => s.projectTaskTicks[projectCode] ?? 0);

  useEffect(() => {
    if (tick <= 0) return;
    void reload();
  }, [tick, reload, projectCode]);
}
