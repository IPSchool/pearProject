import clsx from "clsx";
import type { ReactNode } from "react";

import {
  getDueState,
  isTaskAssigned,
  isTaskStarted,
} from "@/lib/task-list-filters";
import { priorityLabel } from "@/hooks/use-project-tasks";
import { resolutionLabel } from "@/lib/task-resolution";
import type { TaskItem } from "@/types/api";

export { isTaskClosed } from "@/lib/task-resolution";

function Signal({
  title,
  active,
  activeClass,
  inactiveClass,
  children,
}: {
  title: string;
  active: boolean;
  activeClass: string;
  inactiveClass?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex size-6 items-center justify-center rounded-md border",
        active ? activeClass : inactiveClass ?? "border-separator bg-surface text-subtlest",
      )}
      title={title}
    >
      {children}
    </span>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M8 5v14l11-7L8 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M5 4v16M5 4h12l-2 4 2 4H5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M7 3v2M17 3v2M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const PRI_CLASS: Record<number, string> = {
  0: "border-separator bg-surface text-subtle",
  1: "border-warning/40 bg-warning/15 text-warning",
  2: "border-danger/40 bg-danger/15 text-danger",
};

const DUE_CLASS: Record<string, string> = {
  none: "border-dashed border-separator bg-surface text-subtlest",
  later: "border-separator bg-surface text-subtle",
  soon: "border-warning/50 bg-warning/15 text-warning",
  today: "border-accent/50 bg-[var(--ads-color-background-selected)] text-[var(--ads-color-brand)]",
  overdue: "border-danger/50 bg-danger/15 text-danger",
};

const DUE_TITLE: Record<string, string> = {
  none: "未设置截止日",
  later: "截止日尚充裕",
  soon: "截止日在 3 天内",
  today: "今天截止",
  overdue: "已过截止日",
};

export function TaskListIndicators({ task }: { task: TaskItem }) {
  const assigned = isTaskAssigned(task);
  const started = isTaskStarted(task);
  const pri = task.pri ?? 0;
  const dueState = getDueState(task);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Signal
        active={assigned}
        activeClass="border-success/40 bg-success/10 text-success"
        title={assigned ? `已指派：${task.executor?.name ?? "经办人"}` : "未指派经办人"}
      >
        <UserIcon />
      </Signal>
      <Signal
        active={started}
        activeClass="border-[var(--ads-color-brand)]/40 bg-[var(--ads-color-background-selected)] text-[var(--ads-color-brand)]"
        inactiveClass="border-separator bg-surface text-subtlest"
        title={started ? "已开始" : "未开始"}
      >
        <PlayIcon />
      </Signal>
      <Signal
        active={pri > 0}
        activeClass={PRI_CLASS[pri] ?? PRI_CLASS[0]}
        inactiveClass={PRI_CLASS[0]}
        title={`优先级：${task.priText ?? priorityLabel(pri)}`}
      >
        <FlagIcon />
      </Signal>
      <Signal
        active={dueState !== "none"}
        activeClass={DUE_CLASS[dueState]}
        inactiveClass={DUE_CLASS.none}
        title={DUE_TITLE[dueState]}
      >
        <CalendarIcon />
      </Signal>
    </div>
  );
}

export function PriorityBadge({ pri = 0, label }: { pri?: number; label?: string }) {
  const text = label ?? priorityLabel(pri);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 type-body-small font-medium",
        pri === 2 && "bg-danger/15 text-danger",
        pri === 1 && "bg-warning/15 text-warning",
        pri === 0 && "bg-surface-sunken text-subtle",
      )}
    >
      <FlagIcon className="shrink-0" />
      {text}
    </span>
  );
}

export function StatusBadge({ status = 0, done, label }: { status?: number; done?: number; label?: string }) {
  const text =
    label ??
    (done ? "已完成" : status === 0 ? "未开始" : status === 2 ? "进行中" : status === 4 ? "测试中" : status === 3 ? "挂起" : "进行中");
  const tone =
    done || status === 1
      ? "bg-success/15 text-success"
      : status === 0
        ? "bg-surface-sunken text-subtle"
        : status === 3
          ? "bg-warning/15 text-warning"
          : "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-brand)]";

  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 type-body-small font-medium", tone)}>
      <span className={clsx("size-1.5 rounded-full", done ? "bg-success" : status === 0 ? "bg-subtlest" : "bg-[var(--ads-color-brand)]")} />
      {text}
    </span>
  );
}

export function ResolutionBadge({ code, label }: { code?: string | null; label?: string }) {
  const text = resolutionLabel(code, label);
  const resolved = Boolean(code);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 type-body-small font-medium",
        resolved ? "bg-success/15 text-success" : "bg-surface-sunken text-subtle",
      )}
    >
      {resolved ? "✓" : "○"} {text}
    </span>
  );
}


export function DueDateBadge({ task }: { task: TaskItem }) {
  const dueState = getDueState(task);
  if (dueState === "none") {
    return <span className="type-body text-subtlest">—</span>;
  }
  const d = task.end_time ? new Date(task.end_time.replace(/-/g, "/")) : null;
  const text = d
    ? d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 type-body-small font-medium",
        DUE_CLASS[dueState],
      )}
      title={DUE_TITLE[dueState]}
    >
      <CalendarIcon className="shrink-0" />
      {text}
    </span>
  );
}
