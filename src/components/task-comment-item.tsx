import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/react";

import * as taskApi from "@/api/task";
import { MarkdownContent } from "@/components/markdown-content";
import { MemberAvatar } from "@/components/member-avatar";
import {
  commentBody,
  parseCommentForDisplay,
} from "@/lib/comment-thread";
import {
  buildTaskPath,
  commentDomId,
  resolveTaskCommentUrl,
  type TaskUrlInput,
} from "@/lib/issue-url";
import { formatRelativeTime } from "@/lib/datetime";
import type { TaskLogItem, TaskLogReaction } from "@/types/api";

const QUICK_EMOJIS = ["👍", "😄", "🎉", "❤️", "👀", "🔥"] as const;

function logAuthor(item: TaskLogItem) {
  return item.member_name ?? item.member?.name ?? "用户";
}

function logAvatar(item: TaskLogItem) {
  return item.member_avatar ?? item.member?.avatar;
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ActionTextButton({
  label,
  onPress,
  pressed,
}: {
  label: string;
  onPress: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      className={clsx(
        "rounded-md px-1.5 py-0.5 type-hint transition-colors hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
        pressed && "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]",
      )}
      type="button"
      onClick={onPress}
    >
      {label}
    </button>
  );
}

/** Jira 式正文：@mention + 单行/紧凑文本，不渲染 blockquote */
export function CommentBody({ source }: { source: string }) {
  const { mention, text } = parseCommentForDisplay(source);

  if (!mention && !text) return null;

  return (
    <div className="comment-body-inline type-body text-foreground">
      {mention ? <span className="comment-mention">@{mention}</span> : null}
      {text ? (
        <span className={mention ? " ml-1" : undefined}>
          <MarkdownContent className="markdown-prose--comment" source={text} />
        </span>
      ) : null}
    </div>
  );
}

export interface TaskCommentItemProps {
  item: TaskLogItem;
  taskUrl: TaskUrlInput;
  currentMemberCode?: string;
  highlighted?: boolean;
  variant?: "root" | "reply";
  onReply: (item: TaskLogItem) => void;
  onDeleted: () => void;
  onReactionsChange: (logCode: string, reactions: TaskLogReaction[]) => void;
}

export function TaskCommentItem({
  item,
  taskUrl,
  currentMemberCode,
  highlighted,
  variant = "root",
  onReply,
  onDeleted,
  onReactionsChange,
}: TaskCommentItemProps) {
  const commentId = item.id;
  const [reactions, setReactions] = useState<TaskLogReaction[]>(item.reactions ?? []);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isReply = variant === "reply";

  useEffect(() => {
    setReactions(item.reactions ?? []);
  }, [item.id, item.reactions]);

  useEffect(() => {
    if (!highlighted || !rootRef.current) return;
    rootRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted, commentId]);

  const canDelete =
    !!currentMemberCode &&
    (item.member_code === currentMemberCode || item.member?.code === currentMemberCode);

  const commentUrl = resolveTaskCommentUrl({
    ...taskUrl,
    commentId,
  });
  const commentPath = buildTaskPath(taskUrl, commentId);

  const toggleReaction = useCallback(
    async (reaction: string) => {
      if (!item.code) {
        setToast("无法识别评论，请刷新后重试");
        return;
      }
      setBusy(true);
      setToast(null);
      try {
        const next = await taskApi.toggleCommentReaction(item.code, reaction);
        setReactions(next);
        onReactionsChange(item.code, next);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "操作失败");
      } finally {
        setBusy(false);
        setEmojiOpen(false);
      }
    },
    [item.code, onReactionsChange],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(commentUrl);
      setToast("链接已复制");
      window.setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("复制失败");
    }
  }

  async function handleDelete() {
    if (!item.code) return;
    if (!window.confirm("确定删除这条评论？")) return;
    setBusy(true);
    try {
      await taskApi.deleteComment(item.code);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  const likeReaction = reactions.find((r) => r.reaction === "like");

  return (
    <div
      ref={rootRef}
      className={clsx(
        "group scroll-mt-24",
        isReply ? "comment-thread-reply" : "flex gap-3",
        highlighted && "rounded-lg bg-[var(--ads-color-background-selected)]/40 p-1.5 -mx-1.5",
      )}
      id={commentDomId(commentId)}
    >
      <div className={clsx("flex min-w-0 flex-1 gap-2.5", isReply && "gap-2")}>
        <MemberAvatar
          className={clsx("shrink-0", isReply ? "size-7" : "size-8 mt-0.5")}
          name={logAuthor(item)}
          src={logAvatar(item)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span className="type-body font-semibold leading-tight text-foreground">
              {logAuthor(item)}
            </span>
            <a
              aria-label="评论永久链接"
              className="inline-flex size-5 items-center justify-center rounded text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-[var(--ads-color-link)]"
              href={commentPath}
              title="评论链接"
            >
              <LinkChainIcon className="size-3.5" />
            </a>
            <span className="type-hint text-subtle">{formatRelativeTime(item.create_time)}</span>
          </div>

          <CommentBody source={commentBody(item)} />

          {reactions.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {reactions.map((r) => (
                <button
                  key={r.reaction}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 type-hint transition-colors",
                    r.reacted
                      ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
                      : "border-separator bg-surface-sunken hover:border-[var(--ads-color-brand)]",
                  )}
                  disabled={busy}
                  type="button"
                  onClick={() => void toggleReaction(r.reaction)}
                >
                  <span>{r.reaction === "like" ? "👍" : r.reaction}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <ActionTextButton
              label="👍"
              pressed={likeReaction?.reacted}
              onPress={() => void toggleReaction("like")}
            />

            <div className="relative">
              <ActionTextButton label="😀" onPress={() => setEmojiOpen((v) => !v)} />
              {emojiOpen ? (
                <div className="absolute left-0 top-full z-20 mt-1 flex gap-0.5 rounded-lg border border-separator bg-surface p-1 shadow-md">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-[var(--ads-color-background-neutral)]"
                      disabled={busy}
                      type="button"
                      onClick={() => void toggleReaction(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <ActionTextButton label="回复" onPress={() => onReply(item)} />
            <ActionTextButton label="链接" onPress={() => void copyLink()} />

            {canDelete ? (
              <ActionTextButton label="删除" onPress={() => void handleDelete()} />
            ) : null}

            {toast ? (
              <span
                className={clsx(
                  "type-hint ml-1",
                  toast.includes("失败") || toast.includes("无法")
                    ? "text-danger"
                    : "text-[var(--ads-color-text-selected)]",
                )}
              >
                {toast}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 根评论 + 左侧线程线的回复列表（Jira comment-reply-wrapper） */
export function TaskCommentThread({
  root,
  replies,
  taskUrl,
  currentMemberCode,
  highlightCommentId,
  onReply,
  onDeleted,
  onReactionsChange,
}: {
  root: TaskLogItem;
  replies: TaskLogItem[];
  taskUrl: TaskUrlInput;
  currentMemberCode?: string;
  highlightCommentId?: number | null;
  onReply: (item: TaskLogItem) => void;
  onDeleted: () => void;
  onReactionsChange: (logCode: string, reactions: TaskLogReaction[]) => void;
}) {
  return (
    <li className="comment-thread">
      <TaskCommentItem
        currentMemberCode={currentMemberCode}
        highlighted={highlightCommentId != null && root.id === highlightCommentId}
        item={root}
        taskUrl={taskUrl}
        variant="root"
        onDeleted={onDeleted}
        onReactionsChange={onReactionsChange}
        onReply={onReply}
      />
      {replies.length > 0 ? (
        <ul className="comment-thread-replies">
          {replies.map((reply) => (
            <li key={reply.id}>
              <TaskCommentItem
                currentMemberCode={currentMemberCode}
                highlighted={highlightCommentId != null && reply.id === highlightCommentId}
                item={reply}
                taskUrl={taskUrl}
                variant="reply"
                onDeleted={onDeleted}
                onReactionsChange={onReactionsChange}
                onReply={onReply}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TaskHistoryItem({ item }: { item: TaskLogItem }) {
  const text = commentBody(item);
  return (
    <div className="flex gap-3">
      <MemberAvatar className="mt-0.5 shrink-0" name={logAuthor(item)} src={logAvatar(item)} />
      <div className="min-w-0 flex-1">
        <p className="type-body">
          <span className="font-medium">{logAuthor(item)}</span>
          <span className="text-subtle"> · {text || "更新了任务"}</span>
        </p>
        <p className="type-hint mt-0.5 text-subtle">{formatRelativeTime(item.create_time)}</p>
      </div>
    </div>
  );
}

export function TaskCommentComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  replyTo,
  onCancelReply,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  replyTo?: TaskLogItem | null;
  onCancelReply?: () => void;
}) {
  const replyAuthor = replyTo ? logAuthor(replyTo) : null;
  const preview = replyTo ? parseCommentForDisplay(commentBody(replyTo)) : null;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-separator bg-surface-sunken p-3">
      {replyTo && replyAuthor ? (
        <div className="flex items-center justify-between gap-2 border-l-2 border-[var(--ads-color-border)] pl-2.5">
          <p className="type-hint min-w-0 truncate">
            回复 <span className="comment-mention">@{replyAuthor}</span>
            {preview?.text ? (
              <span className="ml-1.5 text-subtle">{preview.text.slice(0, 80)}</span>
            ) : null}
          </p>
          {onCancelReply ? (
            <Button size="sm" variant="tertiary" onPress={onCancelReply}>
              取消
            </Button>
          ) : null}
        </div>
      ) : null}
      <textarea
        className="w-full min-h-16 resize-y rounded-md border border-separator bg-surface px-3 py-2 type-body leading-snug"
        placeholder={replyTo ? `回复 @${replyAuthor}…` : "添加评论…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="flex justify-end">
        <Button isPending={submitting} size="sm" onPress={onSubmit}>
          {replyTo ? "回复" : "发送"}
        </Button>
      </div>
    </div>
  );
}
