/** API: `YYYY-MM-DD HH:mm:ss` ↔ `<input type="datetime-local">`: `YYYY-MM-DDTHH:mm` */

export function pickDateField(row: object, ...keys: string[]): string | undefined {
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function apiDatetimeToLocal(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(" ", "T");
  if (normalized.length >= 16) return normalized.slice(0, 16);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T09:00`;
  return normalized;
}

export function localDatetimeToApi(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const base = trimmed.replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(base)) return base;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(base)) return `${base}:00`;
  return base;
}

export function defaultDatetimeRange(hoursAhead = 24): { begin: string; end: string } {
  const begin = new Date(Date.now() + hoursAhead * 3600_000);
  begin.setMinutes(0, 0, 0);
  begin.setHours(10);
  const end = new Date(begin);
  end.setHours(11);
  return {
    begin: toDatetimeLocalValue(begin),
    end: toDatetimeLocalValue(end),
  };
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatListDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatListDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Jira 风格相对时间，如「21小时前」 */
export function formatRelativeTime(value?: string, now = Date.now()): string {
  if (!value) return "—";
  const d = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(d.getTime())) return value;

  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 0) return "刚刚";
  if (diffSec < 60) return "刚刚";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}周前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}个月前`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}年前`;
}

export function buildTaskCommentUrl(
  projectCode: string,
  taskCode: string,
  commentCode: string,
): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/project/${projectCode}/tasks/${taskCode}#comment-${commentCode}`;
}

/** @deprecated 使用 issue-url.ts 中的 commentDomId */
export function commentDomId(commentCode: string) {
  return `comment-${commentCode}`;
}
