import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";
import clsx from "clsx";

import { clearTaskSchedule, scheduleTaskDueDate } from "@/api/task";
import { useProjectRoute } from "@/contexts/project-context";
import { formatTaskDay, useProjectTasks } from "@/hooks/use-project-tasks";
import { buildTaskPath, taskToUrlInput } from "@/lib/issue-url";
import type { TaskItem } from "@/types/api";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const DND_TASK = "application/x-pear-task";

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: "", day: 0, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d, inMonth: true });
  }
  return cells;
}

function CalendarTaskChip({
  task,
  projectId,
}: {
  task: TaskItem;
  projectId?: number | null;
}) {
  return (
    <div
      draggable
      className="cursor-grab active:cursor-grabbing"
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_TASK, task.code);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <Link
        className="block truncate rounded bg-[var(--ads-color-background-selected)] px-1.5 py-0.5 type-body-small text-[var(--ads-color-text-selected)] hover:underline"
        draggable={false}
        to={buildTaskPath(taskToUrlInput({ ...task, projectId: projectId ?? undefined }))}
        onClick={(e) => e.stopPropagation()}
      >
        {task.name}
      </Link>
    </div>
  );
}

export default function ProjectCalendarPage() {
  const { apiCode, pathId, projectId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const { tasks, loading, error, reload } = useProjectTasks(projectCode);
  const [cursor, setCursor] = useState(() => new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [sidebarDragOver, setSidebarDragOver] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const task of tasks) {
      const day = formatTaskDay(task.end_time || task.begin_time);
      if (!day) continue;
      if (!map[day]) map[day] = [];
      map[day].push(task);
    }
    return map;
  }, [tasks]);

  const unscheduled = tasks.filter((t) => !t.end_time && !t.begin_time);

  const schedule = useCallback(
    async (taskCode: string, date: string) => {
      if (!taskCode || !date) return;
      setScheduling(true);
      try {
        await scheduleTaskDueDate(taskCode, date);
        await reload();
      } finally {
        setScheduling(false);
        setDragOverDate(null);
        setSidebarDragOver(false);
      }
    },
    [reload],
  );

  const unschedule = useCallback(
    async (taskCode: string) => {
      if (!taskCode) return;
      setScheduling(true);
      try {
        await clearTaskSchedule(taskCode);
        await reload();
      } finally {
        setScheduling(false);
        setSidebarDragOver(false);
      }
    },
    [reload],
  );

  function handleDropOnDay(e: React.DragEvent, date: string) {
    e.preventDefault();
    const taskCode = e.dataTransfer.getData(DND_TASK);
    void schedule(taskCode, date);
  }

  function handleDropOnSidebar(e: React.DragEvent) {
    e.preventDefault();
    const taskCode = e.dataTransfer.getData(DND_TASK);
    void unschedule(taskCode);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="tertiary" onPress={() => setCursor(new Date(year, month - 1, 1))}>
              ‹
            </Button>
            <p className="type-heading-xsmall min-w-[8rem] text-center">
              {year}年{month + 1}月
            </p>
            <Button size="sm" variant="tertiary" onPress={() => setCursor(new Date(year, month + 1, 1))}>
              ›
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {scheduling ? <Spinner className="size-4" /> : null}
            <Button size="sm" variant="secondary" onPress={() => setCursor(new Date())}>
              今天
            </Button>
          </div>
        </div>

        {error ? <Card className="p-4 text-danger">{error}</Card> : null}

        <p className="type-hint">将工作项拖到日期格子上安排截止日；拖回右侧侧栏可取消排期。</p>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-separator bg-separator">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-surface-sunken px-2 py-2 text-center type-label">
              周{w}
            </div>
          ))}
          {cells.map((cell, i) => (
            <div
              key={i}
              className={clsx(
                "min-h-24 bg-surface p-2 transition-colors",
                !cell.inMonth && "opacity-40",
                cell.inMonth && dragOverDate === cell.date && "bg-[var(--ads-color-background-selected)] ring-2 ring-inset ring-[var(--ads-color-brand)]",
              )}
              onDragLeave={() => {
                if (dragOverDate === cell.date) setDragOverDate(null);
              }}
              onDragOver={(e) => {
                if (!cell.inMonth || !cell.date) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverDate(cell.date);
              }}
              onDrop={(e) => {
                if (!cell.inMonth || !cell.date) return;
                handleDropOnDay(e, cell.date);
              }}
            >
              {cell.inMonth ? (
                <>
                  <p className="type-hint mb-1">{cell.day}</p>
                  <div className="space-y-1">
                    {(byDay[cell.date] ?? []).slice(0, 4).map((t) => (
                      <CalendarTaskChip key={t.code} projectId={projectId ?? Number(pathId)} task={t} />
                    ))}
                    {(byDay[cell.date]?.length ?? 0) > 4 ? (
                      <p className="type-hint">+{(byDay[cell.date]?.length ?? 0) - 4} 更多</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <aside
        className={clsx(
          "w-72 shrink-0 rounded-lg border bg-surface p-4 transition-colors",
          sidebarDragOver
            ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)]"
            : "border-separator",
        )}
        onDragLeave={() => setSidebarDragOver(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setSidebarDragOver(true);
        }}
        onDrop={handleDropOnSidebar}
      >
        <h3 className="type-heading-xsmall mb-2">未安排的工作</h3>
        <p className="type-hint mb-3">
          拖拽到日历设置截止日；从日历拖回此处可清除日期。
        </p>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto">
          {unscheduled.map((t) => (
            <div
              key={t.code}
              draggable
              className="cursor-grab rounded-md border border-dashed border-separator px-3 py-2 active:cursor-grabbing hover:bg-[var(--ads-color-background-neutral)]"
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_TASK, t.code);
                e.dataTransfer.effectAllowed = "move";
              }}
            >
              <p className="type-body">{t.name}</p>
              <p className="type-hint">{t.code}</p>
            </div>
          ))}
          {!unscheduled.length ? (
            <p className="type-hint py-4 text-center">所有工作都已安排日期</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
