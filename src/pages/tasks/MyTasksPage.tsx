import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button, Card, Spinner } from "@heroui/react";

import { fetchMyTasks, taskDisplayTitle, type MyTasksFilter, type MyTasksType } from "@/api/task";
import { AddToQuickAccessButton } from "@/components/add-to-quick-access-button";
import { TaskStatusChip } from "@/components/task-status-chip";
import { PageHeader } from "@/components/typography";
import { formatTaskDate, priorityLabel } from "@/hooks/use-project-tasks";
import { buildProjectPath, buildTaskPath, taskDisplayKey, taskToUrlInput } from "@/lib/issue-url";
import type { TaskItem } from "@/types/api";

const PAGE_SIZE = 30;

const TABS: { key: MyTasksType; label: string }[] = [
  { key: 1, label: "我执行的" },
  { key: 2, label: "我参与的" },
  { key: 3, label: "我创建的" },
];

const DONE_TABS: { key: MyTasksFilter; label: string }[] = [
  { key: 0, label: "待办" },
  { key: -1, label: "全部" },
];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [taskType, setTaskType] = useState<MyTasksType>(1);
  const [doneFilter, setDoneFilter] = useState<MyTasksFilter>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTasks(page, PAGE_SIZE, taskType, doneFilter);
      setTasks(data.list ?? []);
      setTotal(data.total ?? data.list?.length ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, taskType, doneFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function switchTaskType(next: MyTasksType) {
    setTaskType(next);
    setPage(1);
  }

  function switchDoneFilter(next: MyTasksFilter) {
    setDoneFilter(next);
    setPage(1);
  }

  const projectCodes = new Set(
    tasks.map((t) => t.projectInfo?.code ?? t.project_code).filter(Boolean),
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <AddToQuickAccessButton
            href="/my-tasks"
            kind="page"
            label={`我的任务 · ${TABS.find((t) => t.key === taskType)?.label ?? ""}`}
          />
        }
        description="按执行人、参与者或创建人聚合的工作项；点击标题进入项目内详情。"
        title="我的任务"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-separator bg-surface-sunken p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={clsx(
                "rounded-md px-3 py-1.5 type-body-small transition-colors",
                taskType === tab.key
                  ? "bg-surface font-medium text-foreground shadow-sm"
                  : "text-subtle hover:text-foreground",
              )}
              type="button"
              onClick={() => switchTaskType(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-separator p-1">
          {DONE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={clsx(
                "rounded-md px-3 py-1.5 type-body-small transition-colors",
                doneFilter === tab.key
                  ? "bg-[var(--ads-color-background-selected)] font-medium text-[var(--ads-color-text-selected)]"
                  : "text-subtle hover:text-foreground",
              )}
              type="button"
              onClick={() => switchDoneFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="p-6 text-danger">{error}</Card>
      ) : (
        <>
          {total > 0 ? (
            <Card className="border-none bg-accent/5 p-4 type-meta">
              共 {total} 条
              {doneFilter === 0 ? "待办" : "工作项"}
              {projectCodes.size ? `，来自 ${projectCodes.size} 个项目` : ""}
              {pageCount > 1 ? ` · 第 ${page}/${pageCount} 页` : ""}
            </Card>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-separator">
            <table className="min-w-full text-left">
              <thead className="border-b border-separator bg-surface-sunken">
                <tr>
                  <th className="type-label px-4 py-3 font-medium">工作</th>
                  <th className="type-label px-4 py-3 font-medium">状态</th>
                  <th className="type-label px-4 py-3 font-medium">优先级</th>
                  <th className="type-label px-4 py-3 font-medium">项目</th>
                  <th className="type-label px-4 py-3 font-medium">截止</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <MyTaskRow key={t.code} task={t} />
                ))}
              </tbody>
            </table>
            {!tasks.length ? (
              <p className="p-10 text-center type-meta">暂无工作项</p>
            ) : null}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                isDisabled={page <= 1}
                size="sm"
                variant="secondary"
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <span className="type-meta">
                {page} / {pageCount}
              </span>
              <Button
                isDisabled={page >= pageCount}
                size="sm"
                variant="secondary"
                onPress={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function MyTaskRow({ task }: { task: TaskItem }) {
  const projectId = task.project_id ?? task.projectInfo?.id;
  const projectPathId = projectId ?? task.projectInfo?.code ?? task.project_code;
  const projectName = task.projectInfo?.name ?? task.projectName;
  const title = taskDisplayTitle(task);
  const untitled = !task.name?.trim();
  const taskHref = buildTaskPath(taskToUrlInput(task));
  const displayKey = taskDisplayKey(taskToUrlInput(task));

  return (
    <tr className="border-b border-separator last:border-0 hover:bg-[var(--ads-color-background-neutral)]">
      <td className="px-4 py-3">
        <Link
          className={clsx(
            "type-body font-medium hover:text-[var(--ads-color-link)] hover:underline",
            untitled && "text-subtle italic",
          )}
          to={taskHref}
        >
          {title}
        </Link>
        <p className="type-hint mt-0.5 font-mono text-[0.6875rem]">{displayKey}</p>
      </td>
      <td className="px-4 py-3">
        <TaskStatusChip task={task} />
      </td>
      <td className="type-body px-4 py-3 text-subtle">{priorityLabel(task.pri)}</td>
      <td className="px-4 py-3">
        {projectPathId && projectName ? (
          <Link
            className="type-body text-[var(--ads-color-link)] hover:underline"
            to={buildProjectPath(projectPathId, "overview")}
          >
            {projectName}
          </Link>
        ) : (
          <span className="type-hint">—</span>
        )}
      </td>
      <td className="type-body px-4 py-3 text-subtle">{formatTaskDate(task.end_time)}</td>
    </tr>
  );
}
