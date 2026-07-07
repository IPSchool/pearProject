/**
 * Jira 风格 Issue / Comment URL
 * @see https://wanglaoshi.atlassian.net/browse/KAN-1?focusedCommentId=10001
 *
 * - Ticket:  /browse/{ISSUE_KEY}  或  /project/{projectId}/tasks/{idNum}
 * - 项目:    /project/{projectId}/overview
 * - 评论:    ?focusedCommentId={numericId}
 */

const ISSUE_KEY_RE = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;

export interface TaskUrlInput {
  issueKey?: string | null;
  projectId?: number | null;
  id_num?: number | null;
  /** 内部 API 用 */
  project_code?: string;
  code?: string;
}

export function formatIssueKey(prefix: string, idNum: number): string {
  return `${prefix.toUpperCase()}-${idNum}`;
}

export function isIssueKey(value: string): boolean {
  return ISSUE_KEY_RE.test(value.trim());
}

export function parseIssueKey(value: string): { prefix: string; idNum: number } | null {
  const m = value.trim().match(/^([A-Za-z][A-Za-z0-9_]*)-(\d+)$/);
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), idNum: Number(m[2]) };
}

/** 从任务对象构造 URL 输入 */
export function taskToUrlInput(
  task: Pick<
    TaskUrlInput,
    "issueKey" | "projectId" | "id_num" | "project_code" | "code"
  > & {
    project_id?: number | null;
    projectInfo?: { id?: number; code?: string } | null;
  },
): TaskUrlInput {
  return {
    issueKey: task.issueKey,
    projectId: task.projectId ?? task.project_id ?? task.projectInfo?.id ?? null,
    id_num: task.id_num,
    project_code: task.project_code ?? task.projectInfo?.code,
    code: task.code,
  };
}

/** 用户可见的任务编号 */
export function taskDisplayKey(task: TaskUrlInput): string {
  if (task.issueKey) return task.issueKey;
  if (task.id_num != null) return String(task.id_num);
  if (task.code) return task.code.slice(0, 8);
  return "—";
}

/** /project/{id} */
export function buildProjectPath(projectId: number | string, suffix = "overview"): string {
  const sub = suffix.replace(/^\//, "");
  return `/project/${projectId}/${sub}`;
}

/** Jira browse */
export function buildBrowsePath(issueKey: string, focusedCommentId?: number | string | null): string {
  const key = issueKey.toUpperCase();
  if (focusedCommentId != null && focusedCommentId !== "") {
    return `/browse/${key}?focusedCommentId=${focusedCommentId}`;
  }
  return `/browse/${key}`;
}

export function buildBrowseUrl(issueKey: string, focusedCommentId?: number | string | null): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${buildBrowsePath(issueKey, focusedCommentId)}`;
}

/** 规范任务详情路径（优先 browse，其次数字路径） */
export function buildTaskPath(
  task: TaskUrlInput,
  focusedCommentId?: number | string | null,
): string {
  if (task.issueKey) {
    return buildBrowsePath(task.issueKey, focusedCommentId);
  }
  if (task.projectId != null && task.id_num != null) {
    const base = `/project/${task.projectId}/tasks/${task.id_num}`;
    if (focusedCommentId != null && focusedCommentId !== "") {
      return `${base}?focusedCommentId=${focusedCommentId}`;
    }
    return base;
  }
  if (task.projectId != null && task.code) {
    const base = `/project/${task.projectId}/tasks/${task.code}`;
    if (focusedCommentId != null && focusedCommentId !== "") {
      return `${base}?focusedCommentId=${focusedCommentId}`;
    }
    return base;
  }
  if (task.project_code && task.code) {
    const base = `/project/${task.project_code}/tasks/${task.code}`;
    if (focusedCommentId != null && focusedCommentId !== "") {
      return `${base}?focusedCommentId=${focusedCommentId}`;
    }
    return base;
  }
  return "/my-tasks";
}

export function buildTaskUrl(task: TaskUrlInput, focusedCommentId?: number | string | null): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${buildTaskPath(task, focusedCommentId)}`;
}

export function parseFocusedCommentId(search: string): number | null {
  const id = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "focusedCommentId",
  );
  if (!id || !/^\d+$/.test(id)) return null;
  return Number(id);
}

export function commentDomId(commentId: number | string): string {
  return `comment-${commentId}`;
}

export function resolveTaskCommentUrl(input: TaskUrlInput & { commentId: number }): string {
  return buildTaskUrl(input, input.commentId);
}

/** URL 中的 project 段是否为「简洁数字/id」 */
export function isNumericProjectRef(ref: string): boolean {
  return /^\d+$/.test(ref);
}

/** URL 中的 task 段是否为项目内序号 */
export function isNumericTaskRef(ref: string): boolean {
  return /^\d+$/.test(ref);
}
