import { Link } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";

import { TaskStatusChip } from "@/components/task-status-chip";
import { useProjectRoute } from "@/contexts/project-context";
import { formatTaskDate, priorityLabel, useProjectTasks } from "@/hooks/use-project-tasks";
import { buildProjectPath, buildTaskPath, taskToUrlInput } from "@/lib/issue-url";

export default function ProjectBacklogPage() {
  const { apiCode, pathId, projectId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const { tasks, stages, stageMap, loading, error } = useProjectTasks(projectCode);

  const backlogStage = stages[0];
  const boardStages = stages.slice(1);

  const backlogTasks = tasks.filter((t) => t.stage_code === backlogStage?.code && !t.done);
  const boardTasks = tasks.filter(
    (t) => boardStages.some((s) => s.code === t.stage_code) && !t.done,
  );

  function taskHref(task: (typeof tasks)[0]) {
    return buildTaskPath(
      taskToUrlInput({ ...task, projectId: (projectId ?? Number(pathId)) || undefined }),
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="type-meta">
        第一列「{backlogStage?.name ?? "待处理"}」视为待办事项；其余列视为已排入看板的工作。
      </p>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <section className="rounded-lg border border-separator">
        <header className="flex items-center justify-between border-b border-separator bg-surface-sunken px-4 py-3">
          <h2 className="type-heading-xsmall">
            看板 ({boardTasks.length} 个工作项)
          </h2>
          <Link to={buildProjectPath(pathId, "tasks")}>
            <Button size="sm" variant="secondary">打开看板视图</Button>
          </Link>
        </header>
        <ul className="divide-y divide-separator">
          {boardTasks.map((task) => (
            <li key={task.code} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-[var(--ads-color-background-neutral)]">
              <Link
                className="min-w-0 flex-1 type-body font-medium text-[var(--ads-color-link)] hover:underline"
                to={taskHref(task)}
              >
                {task.name}
              </Link>
              <span className="type-hint">{stageMap[task.stage_code ?? ""] ?? "—"}</span>
              <TaskStatusChip task={task} />
              <span className="type-hint">{task.priText ?? priorityLabel(task.pri)}</span>
              <span className="type-hint">{formatTaskDate(task.end_time)}</span>
            </li>
          ))}
          {!boardTasks.length ? (
            <li className="px-4 py-8 text-center type-meta">看板中暂无进行中的工作项</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-lg border border-separator">
        <header className="flex items-center justify-between border-b border-separator bg-surface-sunken px-4 py-3">
          <h2 className="type-heading-xsmall">
            待办事项 Backlog ({backlogTasks.length} 个工作项)
          </h2>
        </header>
        <ul className="divide-y divide-separator">
          {backlogTasks.map((task) => (
            <li key={task.code} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-[var(--ads-color-background-neutral)]">
              <Link
                className="min-w-0 flex-1 type-body font-medium text-[var(--ads-color-link)] hover:underline"
                to={taskHref(task)}
              >
                {task.name}
              </Link>
              <TaskStatusChip task={task} />
              <span className="type-hint">{formatTaskDate(task.end_time)}</span>
            </li>
          ))}
          {!backlogTasks.length ? (
            <li className="px-4 py-8 text-center type-meta border-2 border-dashed border-separator m-4 rounded-lg">
              无待办事项
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
