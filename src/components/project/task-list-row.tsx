import { useState } from "react";
import { Link } from "react-router-dom";
import { ListBox, Select, Spinner } from "@heroui/react";

import { assignTask, patchTask } from "@/api/task";
import { MemberAvatar } from "@/components/member-avatar";
import { DueDateBadge, TaskListIndicators } from "@/components/project/task-list-indicators";
import { formatTaskDate } from "@/hooks/use-project-tasks";
import { isTaskAssigned } from "@/lib/task-list-filters";
import { buildTaskPath, taskDisplayKey, taskToUrlInput } from "@/lib/issue-url";
import {
  CLOSED_RESOLUTION_OPTIONS,
  effectiveResolution,
  isTaskClosed,
  resolutionLabel,
} from "@/lib/task-resolution";
import type { ListColumnKey } from "@/lib/list-view-columns";
import type { ProjectMember, TaskItem } from "@/types/api";

const PRI_OPTIONS = [
  { value: 0, label: "普通" },
  { value: 1, label: "紧急" },
  { value: 2, label: "非常紧急" },
] as const;

const STATUS_OPTIONS = [
  { value: 0, label: "未开始" },
  { value: 2, label: "进行中" },
  { value: 4, label: "测试中" },
  { value: 3, label: "挂起" },
  { value: 1, label: "已完成" },
] as const;

interface TaskListRowProps {
  task: TaskItem;
  projectId: number | string;
  visibleColumns: ListColumnKey[];
  members: ProjectMember[];
  onUpdated: () => void;
}

function CompactSelect({
  label,
  selectedKey,
  options,
  onChange,
  disabled,
}: {
  label: string;
  selectedKey: string;
  options: Array<{ value: number | string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      aria-label={label}
      isDisabled={disabled}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key != null) onChange(String(key));
      }}
    >
      <Select.Trigger className="min-h-8 h-8 min-w-[6rem] border-0 bg-transparent px-1 shadow-none hover:bg-[var(--ads-color-background-neutral)]">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={String(o.value)} id={String(o.value)} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function TaskListRow({
  task,
  projectId,
  visibleColumns,
  members,
  onUpdated,
}: TaskListRowProps) {
  const [busy, setBusy] = useState(false);
  const closed = isTaskClosed(task);
  const resolution = effectiveResolution(task);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  const show = (key: ListColumnKey) => visibleColumns.includes(key);

  return (
    <tr className="border-b border-separator last:border-0 hover:bg-[var(--ads-color-background-neutral)]">
      {show("work") ? (
        <td className="relative px-4 py-3">
          {busy ? (
            <Spinner className="absolute right-2 top-3 size-4" />
          ) : null}
          <Link
            className="type-body font-medium text-[var(--ads-color-link)] hover:underline"
            to={buildTaskPath(taskToUrlInput({ ...task, projectId: Number(projectId) }))}
          >
            {task.name}
          </Link>
          <p className="type-hint mt-0.5">{taskDisplayKey(taskToUrlInput({ ...task, projectId: Number(projectId) }))}</p>
          <TaskListIndicators task={task} />
        </td>
      ) : null}

      {show("assignee") ? (
        <td className="px-2 py-2">
          <div className="flex items-center gap-1.5">
            {isTaskAssigned(task) && task.executor?.name ? (
              <MemberAvatar name={task.executor.name} src={task.executor.avatar} />
            ) : (
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-warning/50 bg-warning/10 text-warning"
                title="未指派"
              >
                ?
              </span>
            )}
            <CompactSelect
              disabled={busy}
              label="经办人"
              options={[
                { value: "", label: "未分配" },
                ...members.map((m) => ({
                  value: m.code,
                  label: m.name ?? m.code,
                })),
              ]}
              selectedKey={task.assign_to ?? task.executor?.code ?? ""}
              onChange={(key) => {
                void run(async () => {
                  await assignTask(task.code, key);
                });
              }}
            />
          </div>
        </td>
      ) : null}

      {show("reporter") ? (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {task.creator?.name ? (
              <>
                <MemberAvatar name={task.creator.name} src={task.creator.avatar} />
                <span className="type-body">{task.creator.name}</span>
              </>
            ) : (
              <span className="type-body text-subtle">—</span>
            )}
          </div>
        </td>
      ) : null}

      {show("priority") ? (
        <td className="px-2 py-2">
          <CompactSelect
            disabled={busy}
            label="优先级"
            options={PRI_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selectedKey={String(task.pri ?? 0)}
            onChange={(key) => {
              const v = Number(key);
              if (v === (task.pri ?? 0)) return;
              void run(async () => {
                await patchTask(task.code, { pri: v });
              });
            }}
          />
        </td>
      ) : null}

      {show("status") ? (
        <td className="px-2 py-2">
          <CompactSelect
            disabled={busy}
            label="状态"
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selectedKey={String(task.status ?? 0)}
            onChange={(key) => {
              const v = Number(key);
              if (v === (task.status ?? 0)) return;
              void run(async () => {
                await patchTask(task.code, { status: v });
              });
            }}
          />
        </td>
      ) : null}

      {show("resolution") ? (
        <td className="px-2 py-2">
          {closed ? (
            <CompactSelect
              disabled={busy}
              label="解决方案"
              options={CLOSED_RESOLUTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              selectedKey={resolution ?? "fixed"}
              onChange={(key) => {
                if (key === resolution) return;
                void run(async () => {
                  await patchTask(task.code, { resolution: key });
                });
              }}
            />
          ) : (
            <span className="type-body text-subtle" title="任务关闭后可选择解决方案">
              {resolutionLabel(null)}
            </span>
          )}
        </td>
      ) : null}

      {show("created") ? (
        <td className="type-body px-4 py-3 text-subtle">
          {formatTaskDate(task.create_time)}
        </td>
      ) : null}

      {show("due") ? (
        <td className="px-4 py-3">
          <DueDateBadge task={task} />
        </td>
      ) : null}
    </tr>
  );
}

export function listColumnHeader(key: ListColumnKey) {
  const labels: Record<ListColumnKey, string> = {
    work: "工作",
    assignee: "经办人",
    reporter: "报告人",
    priority: "优先级",
    status: "状态",
    resolution: "解决方案",
    created: "创建",
    due: "截止",
  };
  return labels[key];
}
