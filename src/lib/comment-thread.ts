import type { TaskLogItem } from "@/types/api";

export function isTaskComment(item: Pick<TaskLogItem, "is_comment">): boolean {
  return Number(item.is_comment) === 1;
}

export function commentBody(item: Pick<TaskLogItem, "remark" | "content">): string {
  return item.remark || item.content || "";
}

/** 是否为回复（@ 开头或含引用块） */
export function isReplyComment(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) return false;
  if (/^@[^\s\n]+/.test(trimmed)) return true;
  if (/^>\s/m.test(trimmed)) return true;
  if (/<blockquote\b/i.test(trimmed)) return true;
  return false;
}

/** 展示用：提取 @mention，去掉 blockquote 引用块 */
export function parseCommentForDisplay(body: string): { mention?: string; text: string } {
  let raw = body.trim();
  if (!raw) return { text: "" };

  let mention: string | undefined;
  const mentionMatch = raw.match(/^@([^\s\n]+)\s*([\s\S]*)/);
  if (mentionMatch) {
    mention = mentionMatch[1];
    raw = (mentionMatch[2] ?? "").trim();
  }

  raw = raw.replace(/(?:^|\n)(?:>[^\n]*(?:\n|$))+/g, "").trim();
  raw = raw.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "").trim();

  return { mention, text: raw };
}

export interface CommentThread {
  root: TaskLogItem;
  replies: TaskLogItem[];
}

/** 按时间顺序将平铺评论拆成「根评论 + 回复列表」（Jira 式同级回复） */
export function buildCommentThreads(items: TaskLogItem[]): CommentThread[] {
  const threads: CommentThread[] = [];
  let current: CommentThread | null = null;

  for (const item of items) {
    if (!item.is_comment) continue;
    const body = commentBody(item);
    if (isReplyComment(body) && current) {
      current.replies.push(item);
    } else {
      current = { root: item, replies: [] };
      threads.push(current);
    }
  }

  return threads;
}

/** Jira 式回复正文：@作者 内容（不含 blockquote） */
export function formatReplyComment(author: string, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return `@${author}`;
  if (trimmed.startsWith(`@${author}`)) return trimmed;
  return `@${author} ${trimmed}`;
}
