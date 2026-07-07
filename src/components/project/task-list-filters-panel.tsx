import { Button } from "@heroui/react";
import clsx from "clsx";
import { useState } from "react";

import { ChevronRightIcon } from "@/components/nav-icon";
import {
  countActiveFilters,
  DEFAULT_TASK_LIST_FILTERS,
  type AssigneeFilter,
  type DueFilter,
  type ListSortKey,
  type PriorityFilter,
  type ResolutionFilter,
  type StartedFilter,
  type TaskListFilters,
} from "@/lib/task-list-filters";

type ChipOption<T extends string> = { value: T; label: string };

function FilterChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="type-label text-subtle">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={clsx(
              "rounded-md border px-2.5 py-1 type-body-small transition-colors",
              value === opt.value
                ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)] font-medium text-[var(--ads-color-brand)]"
                : "border-separator bg-surface text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
            )}
            type="button"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ASSIGNEE_OPTS: ChipOption<AssigneeFilter>[] = [
  { value: "all", label: "全部" },
  { value: "assigned", label: "已指派" },
  { value: "unassigned", label: "未指派" },
];

const STARTED_OPTS: ChipOption<StartedFilter>[] = [
  { value: "all", label: "全部" },
  { value: "started", label: "已开始" },
  { value: "not_started", label: "未开始" },
];

const PRIORITY_OPTS: ChipOption<PriorityFilter>[] = [
  { value: "all", label: "全部" },
  { value: "2", label: "非常紧急" },
  { value: "1", label: "紧急" },
  { value: "0", label: "普通" },
];

const DUE_OPTS: ChipOption<DueFilter>[] = [
  { value: "all", label: "全部" },
  { value: "overdue", label: "已逾期" },
  { value: "today", label: "今天到期" },
  { value: "soon", label: "3 天内" },
  { value: "set", label: "有截止日" },
  { value: "none", label: "无截止日" },
];

const RESOLUTION_OPTS: ChipOption<ResolutionFilter>[] = [
  { value: "all", label: "全部" },
  { value: "unresolved", label: "未解决" },
  { value: "resolved", label: "已解决" },
  { value: "fixed", label: "已修复" },
  { value: "wont_fix", label: "不予修复" },
  { value: "duplicate", label: "重复" },
  { value: "cannot_reproduce", label: "无法复现" },
];

const SORT_OPTS: ChipOption<ListSortKey>[] = [
  { value: "default", label: "默认" },
  { value: "priority_desc", label: "优先级高→低" },
  { value: "due_asc", label: "截止日临近" },
];

export function TaskListFiltersPanel({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: TaskListFilters;
  onChange: (next: TaskListFilters) => void;
  resultCount: number;
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  function patch<K extends keyof TaskListFilters>(key: K, value: TaskListFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-lg border border-separator bg-surface">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--ads-color-background-neutral)]"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <ChevronRightIcon
            className={clsx("size-4 text-subtle transition-transform", open && "rotate-90")}
          />
          <span className="type-body font-medium">筛选与排序</span>
          {active > 0 ? (
            <span className="rounded-full bg-[var(--ads-color-brand)] px-2 py-0.5 type-hint text-white">
              {active}
            </span>
          ) : null}
        </div>
        <span className="type-hint text-subtle">
          显示 {resultCount} / {totalCount}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-separator px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FilterChipGroup
              label="经办人"
              options={ASSIGNEE_OPTS}
              value={filters.assignee}
              onChange={(v) => patch("assignee", v)}
            />
            <FilterChipGroup
              label="进度"
              options={STARTED_OPTS}
              value={filters.started}
              onChange={(v) => patch("started", v)}
            />
            <FilterChipGroup
              label="优先级"
              options={PRIORITY_OPTS}
              value={filters.priority}
              onChange={(v) => patch("priority", v)}
            />
            <FilterChipGroup
              label="截止日期"
              options={DUE_OPTS}
              value={filters.due}
              onChange={(v) => patch("due", v)}
            />
            <FilterChipGroup
              label="解决方案"
              options={RESOLUTION_OPTS}
              value={filters.resolution}
              onChange={(v) => patch("resolution", v)}
            />
            <FilterChipGroup
              label="排序"
              options={SORT_OPTS}
              value={filters.sort}
              onChange={(v) => patch("sort", v)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-separator pt-3">
            <p className="type-hint text-subtle">
              图例：👤 指派 · ▶ 已开始 · 🚩 优先级 · 📅 截止
            </p>
            {active > 0 ? (
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => onChange(DEFAULT_TASK_LIST_FILTERS)}
              >
                清除筛选
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
