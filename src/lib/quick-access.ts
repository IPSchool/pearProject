export type QuickAccessKind = "page" | "project_view" | "task";

export interface QuickAccessItem {
  id: string;
  kind: QuickAccessKind;
  label: string;
  href: string;
  subtitle?: string;
}

export const BUILTIN_QUICK_ACCESS: QuickAccessItem[] = [
  { id: "builtin:events", kind: "page", label: "日程管理", href: "/events" },
  { id: "builtin:analytics", kind: "page", label: "数据分析", href: "/analytics" },
  { id: "builtin:my-tasks", kind: "page", label: "我的任务", href: "/my-tasks" },
];

export function quickAccessItemId(href: string): string {
  return `pin:${href}`;
}

export function normalizeQuickAccessHref(href: string): string {
  const path = href.split("?")[0].replace(/\/+$/, "") || "/";
  return path;
}

/** 合并内置与用户钉选（纯函数，供组件 useMemo） */
export function mergeQuickAccessItems(pinned: QuickAccessItem[]): QuickAccessItem[] {
  const seen = new Set<string>();
  const merged: QuickAccessItem[] = [];
  for (const item of [...BUILTIN_QUICK_ACCESS, ...pinned]) {
    const key = normalizeQuickAccessHref(item.href);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export function isQuickAccessPinned(href: string, pinned: QuickAccessItem[]): boolean {
  const key = normalizeQuickAccessHref(href);
  return mergeQuickAccessItems(pinned).some(
    (i) => normalizeQuickAccessHref(i.href) === key,
  );
}
