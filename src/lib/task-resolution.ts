/** Jira Resolution 枚举（与后端 TaskResolutionService 对齐） */
export const RESOLUTION_CODES = [
  "fixed",
  "wont_fix",
  "duplicate",
  "incomplete",
  "cannot_reproduce",
  "done",
] as const;

export type ResolutionCode = (typeof RESOLUTION_CODES)[number];

const LABELS: Record<ResolutionCode, string> = {
  fixed: "已修复",
  wont_fix: "不予修复",
  duplicate: "重复",
  incomplete: "未完成",
  cannot_reproduce: "无法复现",
  done: "已完成",
};

const JIRA_NAMES: Record<ResolutionCode, string> = {
  fixed: "Fixed",
  wont_fix: "Won't Fix",
  duplicate: "Duplicate",
  incomplete: "Incomplete",
  cannot_reproduce: "Cannot Reproduce",
  done: "Done",
};

export function resolutionLabel(code?: string | null, fallback?: string) {
  if (fallback?.trim()) return fallback;
  if (!code) return "未解决";
  return LABELS[code as ResolutionCode] ?? code;
}

export function isResolved(code?: string | null) {
  return Boolean(code?.trim());
}

/** 已关闭任务可选择的解决方案（不含「未解决」） */
export const CLOSED_RESOLUTION_OPTIONS = RESOLUTION_CODES.map((value) => ({
  value,
  label: LABELS[value],
  jiraName: JIRA_NAMES[value],
}));

export function isTaskClosed(task: { status?: number }) {
  return task.status === 1;
}

export function effectiveResolution(task: { status?: number; resolution?: string | null }) {
  if (!isTaskClosed(task)) return null;
  return task.resolution ?? "fixed";
}
