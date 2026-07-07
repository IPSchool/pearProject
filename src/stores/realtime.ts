import { create } from "zustand";

import type { WsStatus } from "@/lib/websocket";

type RealtimeState = {
  wsStatus: WsStatus;
  notifyTick: number;
  projectTaskTicks: Record<string, number>;
  setWsStatus: (status: WsStatus) => void;
  bumpNotify: () => void;
  bumpProjectTasks: (projectCode: string) => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  wsStatus: "idle",
  notifyTick: 0,
  projectTaskTicks: {},

  setWsStatus(status) {
    set({ wsStatus: status });
  },

  bumpNotify() {
    set((s) => ({ notifyTick: s.notifyTick + 1 }));
  },

  bumpProjectTasks(projectCode) {
    if (!projectCode) return;
    set((s) => ({
      projectTaskTicks: {
        ...s.projectTaskTicks,
        [projectCode]: (s.projectTaskTicks[projectCode] ?? 0) + 1,
      },
    }));
  },
}));
