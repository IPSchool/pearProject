import { describe, expect, it } from "vitest";

import { handleRealtimeMessage } from "@/lib/realtime-handlers";
import { useRealtimeStore } from "@/stores/realtime";

describe("handleRealtimeMessage", () => {
  it("bumps project refresh on organization:task", () => {
    useRealtimeStore.setState({ projectTaskTicks: {} });
    handleRealtimeMessage({
      action: "organization:task",
      data: { data: { projectCode: "proj-a" } },
    });
    expect(useRealtimeStore.getState().projectTaskTicks["proj-a"]).toBe(1);
  });

  it("bumps notify on task action", () => {
    useRealtimeStore.setState({ notifyTick: 0 });
    handleRealtimeMessage({ action: "task", title: "新任务", msg: "hello" });
    expect(useRealtimeStore.getState().notifyTick).toBe(1);
  });
});
