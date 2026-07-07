import { Link } from "react-router-dom";
import { Card } from "@heroui/react";

import type {
  ProjectOverviewWidgets,
  ProjectRecentActivity,
  ProjectTaskStats,
} from "@/api/projectStats";
import { MemberAvatar } from "@/components/member-avatar";

const STAGE_COLORS = [
  "var(--ads-color-brand)",
  "#6554C0",
  "#00B8D9",
  "#36B37E",
  "#FF5630",
  "#FFAB00",
  "#8993A4",
];

function ActivityCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <span aria-hidden className="text-xl leading-none opacity-70">
        {icon}
      </span>
      <div>
        <p className="type-heading-xlarge">{value}</p>
        <p className="type-hint mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

function DonutChart({
  segments,
  total,
  centerLabel,
}: {
  segments: Array<{ label: string; count: number; color: string }>;
  total: number;
  centerLabel: string;
}) {
  const filtered = segments.filter((s) => s.count > 0);
  let cursor = 0;
  const stops = filtered.map((s) => {
    const pct = total ? (s.count / total) * 100 : 0;
    const start = cursor;
    cursor += pct;
    return `${s.color} ${start}% ${cursor}%`;
  });
  const gradient = stops.length ? `conic-gradient(${stops.join(", ")})` : "var(--ads-color-background-neutral)";

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative size-36 shrink-0">
        <div
          className="size-full rounded-full"
          style={{ background: gradient }}
        />
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface text-center">
          <p className="type-heading-large">{total}</p>
          <p className="type-hint">{centerLabel}</p>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {filtered.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="type-body truncate">{s.label}</span>
            </span>
            <span className="type-body font-medium tabular-nums">{s.count}</span>
          </li>
        ))}
        {!filtered.length ? (
          <li className="type-hint text-center py-4">暂无数据</li>
        ) : null}
      </ul>
    </div>
  );
}

function BarChart({
  items,
  max,
}: {
  items: Array<{ label: string; count: number }>;
  max: number;
}) {
  return (
    <div className="flex h-40 items-end justify-between gap-2 pt-2">
      {items.map((item) => {
        const h = max ? Math.max(8, (item.count / max) * 100) : 8;
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="type-hint tabular-nums">{item.count}</span>
            <div
              className="w-full max-w-10 rounded-t bg-[var(--ads-color-brand)] transition-all"
              style={{ height: `${h}%` }}
            />
            <span className="type-hint max-w-full truncate text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function activityText(item: ProjectRecentActivity) {
  if (item.isComment) return "添加了评论";
  const map: Record<string, string> = {
    done: "完成了任务",
    redo: "重做了任务",
    assign: "指派了任务",
    name: "更新了标题",
    content: "更新了描述",
    pri: "更新了优先级",
    status: "更新了状态",
    setEndTime: "更新了截止时间",
    clearEndTime: "清除了截止时间",
    setBeginTime: "更新了开始时间",
    move: "移动了任务",
    create: "创建了任务",
  };
  return map[item.type] ?? (item.remark || "更新了任务");
}

export function ProjectOverviewWidgetsPanel({
  projectCode,
  stats,
  widgets,
}: {
  projectCode: string;
  stats: ProjectTaskStats | null;
  widgets: ProjectOverviewWidgets | null;
}) {
  const activity = widgets?.activity7d;
  const stageTotal =
    widgets?.stageBreakdown.reduce((n, s) => n + s.count, 0) ?? stats?.total ?? 0;
  const priMax = Math.max(...(widgets?.priorityBreakdown.map((p) => p.count) ?? [0]), 1);

  const donutSegments =
    widgets?.stageBreakdown.map((s, i) => ({
      label: s.stageName,
      count: s.count,
      color: STAGE_COLORS[i % STAGE_COLORS.length],
    })) ?? [];

  return (
    <div className="space-y-4">
      {activity ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActivityCard icon="✓" label="过去 7 天完成" value={activity.completed} />
          <ActivityCard icon="✎" label="过去 7 天更新" value={activity.updated} />
          <ActivityCard icon="＋" label="过去 7 天创建" value={activity.created} />
          <ActivityCard icon="📅" label="未来 7 天到期" value={activity.dueSoon} />
        </div>
      ) : null}

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="type-label">全部任务</p>
            <p className="type-heading-xlarge mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="type-label">未完成</p>
            <p className="type-heading-xlarge mt-1">{stats.unDone}</p>
          </Card>
          <Card className="p-4">
            <p className="type-label">已完成</p>
            <p className="type-heading-xlarge mt-1">{stats.done}</p>
          </Card>
          <Card className="p-4">
            <p className="type-label">逾期 / 今日到期</p>
            <p className="type-heading-xlarge mt-1">
              {stats.overdue} / {stats.expireToday}
            </p>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="type-heading-xsmall mb-4">状态概述（按看板列）</h3>
          <DonutChart
            centerLabel="工作项"
            segments={donutSegments}
            total={stageTotal}
          />
        </Card>

        <Card className="p-5">
          <h3 className="type-heading-xsmall mb-4">优先级细分</h3>
          <BarChart
            items={widgets?.priorityBreakdown.map((p) => ({
              label: p.label,
              count: p.count,
            })) ?? []}
            max={priMax}
          />
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="type-heading-xsmall mb-4">近期动态</h3>
        <ul className="divide-y divide-separator">
          {(widgets?.recentActivity ?? []).map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <MemberAvatar
                className="mt-0.5 shrink-0"
                name={item.member.name ?? "?"}
                src={item.member.avatar}
              />
              <div className="min-w-0 flex-1">
                <p className="type-body">
                  <span className="font-medium">{item.member.name ?? "用户"}</span>
                  {" "}
                  {activityText(item)}
                </p>
                <Link
                  className="type-body-small text-[var(--ads-color-link)] hover:underline"
                  to={`/project/${projectCode}/tasks/${item.taskCode}`}
                >
                  {item.taskName}
                </Link>
                <p className="type-hint mt-0.5">{item.createTime}</p>
              </div>
            </li>
          ))}
          {!widgets?.recentActivity?.length ? (
            <li className="type-hint py-6 text-center">暂无近期动态</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
