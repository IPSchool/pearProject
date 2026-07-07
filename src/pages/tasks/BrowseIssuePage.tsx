import { Link, useParams, useSearchParams } from "react-router-dom";

import { TaskDetailPanel } from "@/components/task-detail-panel";
import { parseFocusedCommentId } from "@/lib/issue-url";

/**
 * Jira 风格 Ticket 页：/browse/KAN-1?focusedCommentId=10001
 */
export default function BrowseIssuePage() {
  const { issueKey = "" } = useParams<{ issueKey: string }>();
  const [searchParams] = useSearchParams();
  const focusedCommentId = parseFocusedCommentId(searchParams.toString());

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Link
        className="inline-flex items-center gap-1 type-body text-[var(--ads-color-link)] hover:underline"
        to="/my-tasks"
      >
        ← 返回
      </Link>
      <TaskDetailPanel
        issueKey={issueKey.toUpperCase()}
        variant="page"
        highlightCommentId={focusedCommentId}
      />
    </div>
  );
}
