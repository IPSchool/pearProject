import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import * as taskApi from "@/api/task";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import { useProjectRoute } from "@/contexts/project-context";
import {
  buildTaskPath,
  isIssueKey,
  isNumericTaskRef,
  parseFocusedCommentId,
  taskToUrlInput,
} from "@/lib/issue-url";
import type { TaskItem } from "@/types/api";

export default function TaskDetailPage() {
  const { taskRef = "" } = useParams<{ code: string; taskRef: string }>();
  const { projectRef, pathId } = useProjectRoute();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const focusedCommentId = parseFocusedCommentId(searchParams.toString());
  const [prefetch, setPrefetch] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!projectRef || !taskRef || isIssueKey(taskRef)) {
      setPrefetch(null);
      return;
    }
    let cancelled = false;
    taskApi
      .fetchTaskByRef(projectRef, taskRef)
      .then((task) => {
        if (!cancelled) setPrefetch(task);
      })
      .catch(() => {
        if (!cancelled) setPrefetch(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectRef, taskRef]);

  useEffect(() => {
    if (!prefetch?.id_num || prefetch.project_id == null) return;
    if (isIssueKey(taskRef)) return;
    if (isNumericTaskRef(taskRef)) return;
    const path = buildTaskPath(taskToUrlInput(prefetch), focusedCommentId);
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (path === currentPath) return;
    navigate(path, { replace: true });
  }, [prefetch, taskRef, focusedCommentId, navigate]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Link
        className="inline-flex items-center gap-1 type-body text-[var(--ads-color-link)] hover:underline"
        to={`/project/${pathId}/tasks`}
      >
        ← 返回看板
      </Link>
      <TaskDetailPanel
        highlightCommentId={focusedCommentId}
        projectRef={projectRef}
        taskRef={taskRef}
        variant="page"
      />
    </div>
  );
}
