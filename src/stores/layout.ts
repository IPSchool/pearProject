import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewMode } from "@/components/view-mode-toggle";

interface LayoutState {
  sidebarCollapsed: boolean;
  /** 聚焦模式：隐藏侧栏，主内容区全宽（类似 Jira 最大化） */
  focusMode: boolean;
  /** 工作台「最近项目」显示方式 */
  recentProjectsView: ViewMode;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (focus: boolean) => void;
  setRecentProjectsView: (mode: ViewMode) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      focusMode: false,
      recentProjectsView: "card",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleFocusMode: () =>
        set((s) => ({
          focusMode: !s.focusMode,
          sidebarCollapsed: !s.focusMode ? true : s.sidebarCollapsed,
        })),
      setFocusMode: (focus) => set({ focusMode: focus }),
      setRecentProjectsView: (mode) => set({ recentProjectsView: mode }),
    }),
    { name: "pear-hero-layout" },
  ),
);
