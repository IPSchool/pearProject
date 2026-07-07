import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";

import { useProjectRoute } from "@/contexts/project-context";
import { formatTaskDay, useProjectTasks } from "@/hooks/use-project-tasks";
import { buildTaskPath, taskToUrlInput } from "@/lib/issue-url";

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function monthLabel(d: Date) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default function ProjectTimelinePage() {
  const { apiCode, pathId, projectId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const { tasks, loading, error } = useProjectTasks(projectCode);
  const [start] = useState(() => addMonths(new Date(), -1));

  const months = useMemo(
    () => [0, 1, 2, 3, 4, 5].map((i) => addMonths(start, i)),
    [start],
  );

  const rangeStart = months[0].getTime();
  const rangeEnd = addMonths(months[months.length - 1], 1).getTime();
  const span = rangeEnd - rangeStart;

  const bars = useMemo(() => {
    return tasks
      .map((task) => {
        const from = formatTaskDay(task.begin_time || task.end_time);
        const to = formatTaskDay(task.end_time || task.begin_time);
        if (!from && !to) return null;
        const startMs = new Date((from || to)!.replace(/-/g, "/")).getTime();
        const endMs = new Date((to || from)!.replace(/-/g, "/")).getTime() + 86400000;
        const left = Math.max(0, ((startMs - rangeStart) / span) * 100);
        const width = Math.max(2, ((endMs - startMs) / span) * 100);
        return { task, left, width };
      })
      .filter(Boolean) as Array<{ task: (typeof tasks)[0]; left: number; width: number }>;
  }, [tasks, rangeStart, span]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="type-meta">按开始/截止日期展示工作项时间线</p>
        <Button size="sm" variant="secondary" onPress={() => {}}>
          月
        </Button>
      </div>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <div className="overflow-x-auto rounded-lg border border-separator">
        <div className="min-w-[48rem]">
          <div className="grid border-b border-separator bg-surface-sunken" style={{ gridTemplateColumns: "12rem 1fr" }}>
            <div className="type-label px-4 py-2">工作</div>
            <div className="flex">
              {months.map((m) => (
                <div key={m.toISOString()} className="flex-1 border-l border-separator px-2 py-2 type-label text-center">
                  {monthLabel(m)}
                </div>
              ))}
            </div>
          </div>

          {bars.length ? (
            bars.map(({ task, left, width }) => (
              <div
                key={task.code}
                className="grid border-b border-separator last:border-0"
                style={{ gridTemplateColumns: "12rem 1fr" }}
              >
                <div className="px-4 py-3">
                  <Link
                    className="type-body font-medium text-[var(--ads-color-link)] hover:underline line-clamp-2"
                    to={buildTaskPath(
                      taskToUrlInput({ ...task, projectId: (projectId ?? Number(pathId)) || undefined }),
                    )}
                  >
                    {task.name}
                  </Link>
                </div>
                <div className="relative px-2 py-3">
                  <div
                    className="absolute top-1/2 h-6 -translate-y-1/2 rounded bg-[var(--ads-color-brand)]/80"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={task.name}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="p-8 text-center type-meta">暂无带日期的任务，请在任务详情中设置开始/截止日期</p>
          )}
        </div>
      </div>
    </div>
  );
}
