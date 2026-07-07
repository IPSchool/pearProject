import { useMemo } from "react";

import {
  TaskCommentComposer,
  TaskCommentThread,
  TaskHistoryItem,
} from "@/components/task-comment-item";
import { buildCommentThreads, isTaskComment } from "@/lib/comment-thread";
import type { TaskUrlInput } from "@/lib/issue-url";
import type { TaskLogItem, TaskLogReaction } from "@/types/api";

export function TaskActivityFeed({
  items,
  taskUrl,
  currentMemberCode,
  showComposer,
  comment,
  onCommentChange,
  onSubmitComment,
  submitting,
  replyTo,
  onReply,
  onCancelReply,
  onReload,
  onReactionsChange,
  highlightCommentId,
  feedMode = "all",
}: {
  items: TaskLogItem[];
  taskUrl: TaskUrlInput;
  currentMemberCode?: string;
  feedMode?: "all" | "comments" | "history" | "worktime";
  showComposer?: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
  submitting?: boolean;
  replyTo?: TaskLogItem | null;
  onReply: (item: TaskLogItem) => void;
  onCancelReply: () => void;
  onReload: () => void;
  onReactionsChange: (logCode: string, reactions: TaskLogReaction[]) => void;
  highlightCommentId?: number | null;
}) {
  const commentThreads = useMemo(
    () => buildCommentThreads(items.filter(isTaskComment)),
    [items],
  );

  const historyItems = useMemo(
    () => items.filter((i) => !isTaskComment(i)),
    [items],
  );

  const emptyHint = useMemo(() => {
    if (feedMode === "history") return "暂无历史记录";
    if (feedMode === "comments") return "暂无评论";
    if (feedMode === "all") return "暂无活动";
    return "暂无记录";
  }, [feedMode]);

  const hasItems = commentThreads.length > 0 || historyItems.length > 0;

  return (
    <>
      <ul className="comment-thread">
        {commentThreads.map((thread) => (
          <TaskCommentThread
            key={thread.root.id}
            currentMemberCode={currentMemberCode}
            highlightCommentId={highlightCommentId}
            replies={thread.replies}
            root={thread.root}
            taskUrl={taskUrl}
            onDeleted={onReload}
            onReactionsChange={onReactionsChange}
            onReply={onReply}
          />
        ))}
        {historyItems.map((item) => (
          <li key={item.id} className="py-2">
            <TaskHistoryItem item={item} />
          </li>
        ))}
        {!hasItems ? <li className="type-hint py-4">{emptyHint}</li> : null}
      </ul>
      {showComposer ? (
        <TaskCommentComposer
          replyTo={replyTo}
          submitting={submitting}
          value={comment}
          onCancelReply={onCancelReply}
          onChange={onCommentChange}
          onSubmit={onSubmitComment}
        />
      ) : null}
    </>
  );
}
