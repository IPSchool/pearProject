import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import * as milestoneApi from "@/api/milestone";
import type { Milestone } from "@/api/milestone";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import { milestoneStatusLabel } from "@/lib/milestone-status";

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
      <div
        className="h-full rounded-full bg-[var(--ads-color-brand)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProjectMilestonesPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const projectPathId = pathId;
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await milestoneApi.ensureMilestoneGroup(projectCode);
      setMilestones(await milestoneApi.fetchProjectMilestones(projectCode));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await milestoneApi.createMilestone(projectCode, name.trim(), {
        description: desc.trim(),
        planPublishTime: targetDate ? `${targetDate} 18:00:00` : "",
      });
      setOpen(false);
      setName("");
      setTargetDate("");
      setDesc("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={<Button onPress={() => setOpen(true)}>新建里程碑</Button>}
        description="对齐 Jira Fix Version：为发布周期规划工作项，跟踪完成进度（类似 Sprint 目标，但按交付节点而非迭代排期）。"
        size="medium"
        title="里程碑"
      />

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {milestones.map((m) => {
            const total = m.task_total ?? 0;
            const done = m.task_done ?? 0;
            const progress = m.schedule ?? (total ? Math.round((done / total) * 100) : 0);
            return (
              <Link key={m.code} to={`/project/${projectPathId}/milestones/${m.code}`}>
                <Card className="h-full p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <p className="type-body font-medium">{m.name}</p>
                    <Chip size="sm" variant="soft">
                      {milestoneStatusLabel(m.status, m.statusText)}
                    </Chip>
                  </div>
                  {m.description ? (
                    <p className="type-hint mt-2 line-clamp-2">{m.description}</p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between type-meta text-subtle">
                      <span>
                        工作项 {done}/{total}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                  {m.plan_publish_time ? (
                    <p className="type-meta mt-3 text-subtle">目标日期 {m.plan_publish_time.slice(0, 10)}</p>
                  ) : null}
                </Card>
              </Link>
            );
          })}
          {!milestones.length ? (
            <Card className="p-10 col-span-full text-center type-meta">
              暂无里程碑。创建后可在工作项详情中纳入，用于发布规划与进度跟踪。
            </Card>
          ) : null}
        </div>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>新建里程碑</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="name">
                <Label>名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    placeholder="例如 v1.0、2026-Q2 发布"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
              <TextField name="targetDate">
                <Label>目标完成日期</Label>
                <InputGroup>
                  <InputGroup.Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </InputGroup>
              </TextField>
              <TextField name="desc">
                <Label>说明</Label>
                <InputGroup>
                  <InputGroup.Input value={desc} onChange={(e) => setDesc(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={handleCreate}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
