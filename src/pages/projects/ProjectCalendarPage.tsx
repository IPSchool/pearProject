import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ListBox, Select, Spinner } from "@heroui/react";
import clsx from "clsx";

import { fetchProjectMembers } from "@/api/member";
import { clearTaskSchedule, scheduleTaskDueDate } from "@/api/task";
import { MemberAvatar } from "@/components/member-avatar";
import { useProjectRoute } from "@/contexts/project-context";
import { useRealtimeProjectRefresh } from "@/hooks/use-realtime-project-refresh";
import { formatTaskDay, useProjectTasks } from "@/hooks/use-project-tasks";
import { buildTaskPath, taskToUrlInput } from "@/lib/issue-url";
import type { ProjectMember, TaskItem } from "@/types/api";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const DND_TASK = "application/x-pear-task";

type CalendarView = "month" | "week" | "day";

const VIEW_OPTIONS: { key: CalendarView; label: string }[] = [
  { key: "month", label: "月" },
  { key: "week", label: "周" },
  { key: "day", label: "日" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeekMonday(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: "", day: 0, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    cells.push({ date, day: d, inMonth: true });
  }
  return cells;
}

function weekDays(cursor: Date) {
  const start = startOfWeekMonday(cursor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: toDateKey(d),
      day: d.getDate(),
      month: d.getMonth() + 1,
      inMonth: true,
    };
  });
}

function formatNavTitle(cursor: Date, view: CalendarView) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth() + 1;
  const d = cursor.getDate();
  if (view === "month") {
    return `${y}年${m}月`;
  }
  if (view === "day") {
    const weekday = WEEKDAYS[(cursor.getDay() + 6) % 7];
    return `${y}年${m}月${d}日 · 周${weekday}`;
  }
  const days = weekDays(cursor);
  const first = days[0];
  const last = days[6];
  const fy = cursor.getFullYear();
  if (first.date.slice(0, 7) === last.date.slice(0, 7)) {
    return `${fy}年${first.month}月${first.day}日 – ${last.day}日`;
  }
  return `${first.month}月${first.day}日 – ${last.month}月${last.day}日`;
}

function shiftCursor(cursor: Date, view: CalendarView, delta: -1 | 1) {
  const next = new Date(cursor);
  if (view === "month") {
    next.setMonth(next.getMonth() + delta);
    next.setDate(1);
    return next;
  }
  if (view === "week") {
    next.setDate(next.getDate() + delta * 7);
    return next;
  }
  next.setDate(next.getDate() + delta);
  return next;
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

function DayNumber({ day, isToday }: { day: number; isToday: boolean }) {
  return (
    <p
      className={clsx(
        "type-hint mb-1 inline-flex size-6 items-center justify-center rounded-full",
        isToday && "bg-[var(--ads-color-brand)]/15 font-medium text-[var(--ads-color-brand)]",
      )}
    >
      {day}
    </p>
  );
}

function CalendarMemberFilter({
  members,
  value,
  onChange,
}: {
  members: ProjectMember[];
  value: string;
  onChange: (memberCode: string) => void;
}) {
  const selectedMember = members.find((m) => m.code === value);

  return (
    <Select
      aria-label="参与人筛选"
      selectedKey={value || "all"}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key) === "all" ? "" : String(key));
      }}
    >
      <Select.Trigger className="min-h-8 h-8 min-w-[9.5rem]">
        <div className="flex min-w-0 items-center gap-2">
          {selectedMember ? (
            <MemberAvatar className="size-5 shrink-0" name={selectedMember.name} src={selectedMember.avatar} />
          ) : null}
          <Select.Value>{selectedMember ? selectedMember.name : "全部参与人"}</Select.Value>
        </div>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="all" textValue="全部参与人">
            全部参与人
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {members.map((member) => (
            <ListBox.Item key={member.code} id={member.code} textValue={member.name}>
              <div className="flex items-center gap-2">
                <MemberAvatar className="size-5 shrink-0" name={member.name} src={member.avatar} />
                <span className="truncate">{member.name}</span>
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function CalendarViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <div
      aria-label="日历视图"
      className="inline-flex items-center rounded-md border border-separator p-0.5"
      role="group"
    >
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          aria-pressed={value === opt.key}
          className={clsx(
            "rounded px-3 py-1.5 type-body-small transition-colors",
            value === opt.key
              ? "bg-[var(--ads-color-background-selected)] font-medium text-[var(--ads-color-text-selected)]"
              : "text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
          )}
          type="button"
          onClick={() => onChange(opt.key)}
        >
          {opt.label}视图
        </button>
      ))}
    </div>
  );
}

type DayCellProps = {
  date: string;
  dayLabel: React.ReactNode;
  tasks: TaskItem[];
  projectId?: number | null;
  dragOverDate: string | null;
  setDragOverDate: (date: string | null) => void;
  onDropDay: (e: React.DragEvent, date: string) => void;
  className?: string;
  maxTasks?: number;
  inactive?: boolean;
  isToday?: boolean;
};

function DayCell({
  date,
  dayLabel,
  tasks,
  projectId,
  dragOverDate,
  setDragOverDate,
  onDropDay,
  className,
  maxTasks = 4,
  inactive = false,
  isToday = false,
}: DayCellProps) {
  const droppable = !inactive && date;
  const isDragTarget = droppable && dragOverDate === date;
  return (
    <div
      className={clsx(
        "bg-surface p-2 transition-colors",
        inactive && "opacity-40",
        isToday && !isDragTarget && "bg-[var(--ads-color-background-selected)]/35",
        isDragTarget && "bg-[var(--ads-color-background-selected)] ring-2 ring-inset ring-[var(--ads-color-brand)]",
        className,
      )}
      onDragLeave={() => {
        if (dragOverDate === date) setDragOverDate(null);
      }}
      onDragOver={(e) => {
        if (!droppable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverDate(date);
      }}
      onDrop={(e) => {
        if (!droppable) return;
        onDropDay(e, date);
      }}
    >
      {dayLabel}
      {droppable ? (
        <div className="space-y-1">
          {tasks.slice(0, maxTasks).map((t) => (
            <CalendarTaskChip key={t.code} projectId={projectId} task={t} />
          ))}
          {tasks.length > maxTasks ? (
            <p className="type-hint">+{tasks.length - maxTasks} 更多</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ProjectCalendarPage() {
  const { apiCode, pathId, projectId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const [memberFilter, setMemberFilter] = useState("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const { tasks, loading, error, reload } = useProjectTasks(projectCode, memberFilter);
  useRealtimeProjectRefresh(projectCode, reload);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [sidebarDragOver, setSidebarDragOver] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchProjectMembers(projectCode, 1, 100);
        if (!cancelled) setMembers(data.list ?? []);
      } catch {
        if (!cancelled) setMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectCode]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthCells = useMemo(() => monthMatrix(year, month), [year, month]);
  const weekCells = useMemo(() => weekDays(cursor), [cursor]);
  const dayKey = toDateKey(cursor);
  const todayKey = toDateKey(new Date());
  const isFocusedOnToday = useMemo(() => {
    if (view === "day") return dayKey === todayKey;
    if (view === "week") return weekCells.some((cell) => cell.date === todayKey);
    const now = new Date();
    return cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth();
  }, [view, dayKey, todayKey, weekCells, cursor]);

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
  const navTitle = formatNavTitle(cursor, view);
  const pid = projectId ?? Number(pathId);

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
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 justify-self-start">
            <CalendarViewToggle value={view} onChange={setView} />
            <CalendarMemberFilter members={members} value={memberFilter} onChange={setMemberFilter} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              aria-label="上一段"
              size="sm"
              variant="tertiary"
              onPress={() => setCursor((c) => shiftCursor(c, view, -1))}
            >
              ‹
            </Button>
            <p className="type-heading-xsmall min-w-[10rem] text-center whitespace-nowrap">
              {navTitle}
            </p>
            <Button
              aria-label="下一段"
              size="sm"
              variant="tertiary"
              onPress={() => setCursor((c) => shiftCursor(c, view, 1))}
            >
              ›
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            {scheduling ? <Spinner className="size-4" /> : null}
            <Button
              size="sm"
              variant={isFocusedOnToday ? "primary" : "secondary"}
              onPress={() => setCursor(new Date())}
            >
              今天
            </Button>
          </div>
        </div>

        {error ? <Card className="p-4 text-danger">{error}</Card> : null}

        <p className="type-hint">
          将工作项拖到日期格子上安排截止日；拖回右侧侧栏可取消排期。
          {memberFilter ? " 当前仅显示所选参与人相关的工作项。" : null}
        </p>

        {view === "month" ? (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-separator bg-separator">
            {WEEKDAYS.map((w) => (
              <div key={w} className="bg-surface-sunken px-2 py-2 text-center type-label">
                周{w}
              </div>
            ))}
            {monthCells.map((cell, i) => (
              <DayCell
                key={i}
                className="min-h-24"
                date={cell.date}
                dayLabel={
                  cell.inMonth ? (
                    <DayNumber day={cell.day} isToday={cell.date === todayKey} />
                  ) : null
                }
                dragOverDate={dragOverDate}
                inactive={!cell.inMonth}
                isToday={cell.inMonth && cell.date === todayKey}
                projectId={pid}
                setDragOverDate={setDragOverDate}
                tasks={cell.inMonth ? (byDay[cell.date] ?? []) : []}
                onDropDay={handleDropOnDay}
              />
            ))}
          </div>
        ) : null}

        {view === "week" ? (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-separator bg-separator">
            {weekCells.map((cell, i) => (
              <div
                key={cell.date}
                className={clsx(
                  "px-2 py-2 text-center type-label",
                  cell.date === todayKey
                    ? "bg-[var(--ads-color-background-selected)]/35 text-[var(--ads-color-brand)]"
                    : "bg-surface-sunken",
                )}
              >
                <span className="block text-subtle">{cell.month}/{cell.day}</span>
                <span>周{WEEKDAYS[i]}</span>
              </div>
            ))}
            {weekCells.map((cell) => (
              <DayCell
                key={`body-${cell.date}`}
                className="min-h-48"
                date={cell.date}
                dayLabel={null}
                dragOverDate={dragOverDate}
                isToday={cell.date === todayKey}
                maxTasks={8}
                projectId={pid}
                setDragOverDate={setDragOverDate}
                tasks={byDay[cell.date] ?? []}
                onDropDay={handleDropOnDay}
              />
            ))}
          </div>
        ) : null}

        {view === "day" ? (
          <DayCell
            className="min-h-[28rem] rounded-lg border border-separator"
            date={dayKey}
            dayLabel={
              <p className="type-heading-xsmall mb-3">
                {formatNavTitle(cursor, "day")}
              </p>
            }
            dragOverDate={dragOverDate}
            isToday={dayKey === todayKey}
            maxTasks={50}
            projectId={pid}
            setDragOverDate={setDragOverDate}
            tasks={byDay[dayKey] ?? []}
            onDropDay={handleDropOnDay}
          />
        ) : null}
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
