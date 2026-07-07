import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BUILTIN_QUICK_ACCESS,
  isQuickAccessPinned,
  normalizeQuickAccessHref,
  quickAccessItemId,
  type QuickAccessItem,
} from "@/lib/quick-access";

interface QuickAccessState {
  pinned: QuickAccessItem[];
  add: (item: Omit<QuickAccessItem, "id"> & { id?: string }) => void;
  remove: (id: string) => void;
  toggle: (item: Omit<QuickAccessItem, "id"> & { id?: string }) => void;
}

export const useQuickAccessStore = create<QuickAccessState>()(
  persist(
    (set, get) => ({
      pinned: [],

      add(item) {
        const href = normalizeQuickAccessHref(item.href);
        const id = item.id ?? quickAccessItemId(href);
        if (BUILTIN_QUICK_ACCESS.some((b) => b.id === id)) return;
        set((state) => {
          if (state.pinned.some((p) => p.id === id || normalizeQuickAccessHref(p.href) === href)) {
            return state;
          }
          return {
            pinned: [...state.pinned, { ...item, id, href }],
          };
        });
      },

      remove(id) {
        if (BUILTIN_QUICK_ACCESS.some((b) => b.id === id)) return;
        set((state) => ({
          pinned: state.pinned.filter((p) => p.id !== id),
        }));
      },

      toggle(item) {
        const href = normalizeQuickAccessHref(item.href);
        const id = item.id ?? quickAccessItemId(href);
        if (isQuickAccessPinned(href, get().pinned)) {
          get().remove(id);
        } else {
          get().add({ ...item, id });
        }
      },
    }),
    {
      name: "pear-hero-quick-access",
      version: 1,
      /** 只持久化 pinned，避免旧版把 store 方法写入 localStorage */
      partialize: (state) => ({ pinned: state.pinned }),
      migrate: (persisted) => {
        const raw = persisted as { pinned?: QuickAccessItem[] } | undefined;
        return { pinned: Array.isArray(raw?.pinned) ? raw.pinned : [] };
      },
    },
  ),
);
