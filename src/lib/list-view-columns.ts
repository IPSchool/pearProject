export type ListColumnKey =
  | "work"
  | "assignee"
  | "reporter"
  | "priority"
  | "status"
  | "resolution"
  | "created"
  | "due";

export interface ListColumnDef {
  key: ListColumnKey;
  label: string;
  /** 不可隐藏 */
  locked?: boolean;
}

export const LIST_COLUMNS: ListColumnDef[] = [
  { key: "work", label: "工作", locked: true },
  { key: "assignee", label: "经办人" },
  { key: "reporter", label: "报告人" },
  { key: "priority", label: "优先级" },
  { key: "status", label: "状态" },
  { key: "resolution", label: "解决方案" },
  { key: "created", label: "创建" },
  { key: "due", label: "截止" },
];

export const DEFAULT_VISIBLE_COLUMNS: ListColumnKey[] = LIST_COLUMNS.map((c) => c.key);

const STORAGE_PREFIX = "pear:list-columns:";

export function loadVisibleColumns(projectCode: string): ListColumnKey[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectCode}`);
    if (!raw) return DEFAULT_VISIBLE_COLUMNS;
    const parsed = JSON.parse(raw) as ListColumnKey[];
    if (!Array.isArray(parsed) || !parsed.includes("work")) return DEFAULT_VISIBLE_COLUMNS;
    return (parsed as string[]).filter(
      (k) => k !== "stage" && LIST_COLUMNS.some((c) => c.key === k),
    ) as ListColumnKey[];
  } catch {
    return DEFAULT_VISIBLE_COLUMNS;
  }
}

export function saveVisibleColumns(projectCode: string, keys: ListColumnKey[]) {
  const next = keys.includes("work") ? keys : (["work", ...keys] as ListColumnKey[]);
  localStorage.setItem(`${STORAGE_PREFIX}${projectCode}`, JSON.stringify(next));
}
