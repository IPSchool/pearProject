import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Chip, ListBox, Select, Spinner } from "@heroui/react";

import * as milestoneApi from "@/api/milestone";
import type { Milestone } from "@/api/milestone";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import { buildTaskPath, taskDisplayKey } from "@/lib/issue-url";
import { MILESTONE_STATUS, milestoneStatusLabel } from "@/lib/milestone-status";
import type { TaskItem } from "@/types/api";

export default function ProjectMilestoneDetailPage() {
  const { pathId } = useProjectRoute();
  const projectPathId = pathId;
  const { milestoneCode = "" } = useParams<{ milestoneCode: string }>();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, taskList] = await Promise.all([
        milestoneApi.fetchMilestoneDetail(milestoneCode),
        milestoneApi.fetchMilestoneTasks(milestoneCode),
      ]);
      setMilestone(detail);
      setTasks(taskList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [milestoneCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function onStatusChange(status: number) {
    setActing("status");
    try {
      await milestoneApi.changeMilestoneStatus(milestoneCode, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新状态失败");
    } finally {
      setActing(null);
    }
  }

  async function onRemoveTask(taskCode: string) {
    setActing(taskCode);
    try {
      await milestoneApi.removeTaskFromMilestone(taskCode);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "移除失败");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!milestone) {
    return <Card className="p-6 text-danger">{error ?? "里程碑不存在"}</Card>;
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 1).length;
  const progress = total ? Math.round((done / total) * 100) : milestone.schedule ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <Button variant="tertiary" onPress={() => navigate(`/project/${projectPathId}/milestones`)}>
            返回列表
          </Button>
        }
        description={milestone.description || "纳入此里程碑的工作项将计入发布进度。"}
        size="medium"
        title={milestone.name}
      />

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Chip size="sm" variant="soft">
            {milestoneStatusLabel(milestone.status, milestone.statusText)}
          </Chip>
          <span className="type-meta text-subtle">
            进度 {done}/{total}（{progress}%）
          </span>
          {milestone.plan_publish_time ? (
            <span className="type-meta text-subtle">
              目标 {milestone.plan_publish_time.slice(0, 10)}
            </span>
          ) : null}
        </div>

        <div className="max-w-xs">
          <p className="type-hint mb-1.5">状态</p>
          <Select
            aria-label="里程碑状态"
            isDisabled={acting === "status"}
            selectedKey={String(milestone.status ?? 0)}
            onSelectionChange={(key) => onStatusChange(Number(key))}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {MILESTONE_STATUS.map((s) => (
                  <ListBox.Item key={String(s.value)} id={String(s.value)} textValue={s.label}>
                    {s.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="type-heading-xsmall">纳入的工作项</h2>
          <p className="type-hint text-subtle">在工作项详情 → 里程碑 中纳入</p>
        </div>
        {tasks.length ? (
          <ul className="divide-y divide-separator rounded-lg border border-separator bg-surface">
            {tasks.map((t) => (
              <li key={t.code} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link
                  className="min-w-0 flex-1 hover:text-accent"
                  to={buildTaskPath(projectPathId, taskDisplayKey(t))}
                >
                  <span className="type-meta text-subtle mr-2">{taskDisplayKey(t)}</span>
                  <span className="type-body">{t.name}</span>
                </Link>
                <Button
                  isPending={acting === t.code}
                  size="sm"
                  variant="tertiary"
                  onPress={() => onRemoveTask(t.code)}
                >
                  移出
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-8 text-center type-meta">
            暂无工作项。打开任意 Issue，在侧栏「里程碑」中选择本节点即可纳入。
          </Card>
        )}
      </section>
    </div>
  );
}
