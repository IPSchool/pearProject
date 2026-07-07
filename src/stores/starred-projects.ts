import { create } from "zustand";

import { setProjectCollect, fetchCollectedProjects } from "@/api/collect";
import type { ProjectSummary } from "@/types/api";

interface StarredProjectsState {
  projects: ProjectSummary[];
  loading: boolean;
  load: () => Promise<void>;
  setCollected: (projectCode: string, collected: boolean) => Promise<void>;
}

export const useStarredProjectsStore = create<StarredProjectsState>((set, get) => ({
  projects: [],
  loading: false,

  async load() {
    set({ loading: true });
    try {
      const data = await fetchCollectedProjects(1, 100);
      set({
        projects: (data.list ?? []) as ProjectSummary[],
      });
    } catch {
      set({ projects: [] });
    } finally {
      set({ loading: false });
    }
  },

  async setCollected(projectCode, collected) {
    await setProjectCollect(projectCode, collected);
    if (collected) {
      await get().load();
    } else {
      set((state) => ({
        projects: state.projects.filter((p) => p.code !== projectCode),
      }));
    }
  },
}));
