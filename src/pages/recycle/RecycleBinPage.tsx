import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Button, ListBox, Select, Spinner } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import * as recycleApi from "@/api/recycle";
import { taskDisplayTitle } from "@/api/task";
import { SimpleDataTable } from "@/components/simple-data-table";
import { PageHeader } from "@/components/typography";
import { formatListDate, formatListDateTime, pickDateField } from "@/lib/datetime";
import type { ProjectSummary } from "@/types/api";

const tabs = [
  { key: "projects", label: "已删项目" },
  { key: "tasks", label: "已删任务" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface DeletedTaskRow {
  code: string;
  name: string;
  deleted_time?: string;
  create_time?: string;
}

export default function RecycleBinPage() {
  const [tab, setTab] = useState<TabKey>("projects");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [projectCode, setProjectCode] = useState("");
  const [tasks, setTasks] = useState<DeletedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "projects") {
        const data = await recycleApi.fetchDeletedProjects(1, 100);
        setProjects(data.list ?? []);
      } else if (projectCode) {
        const data = await recycleApi.fetchDeletedTasks(projectCode, 1, 100);
        setTasks((data.list ?? []) as DeletedTaskRow[]);
      } else {
        setTasks([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [tab, projectCode]);

  useEffect(() => {
    fetchSelfProjects(1, 50)
      .then((d) => {
        const list = d.list ?? [];
        setAllProjects(list);
        if (list[0]?.code) setProjectCode(list[0].code);
      })
      .catch(() => setAllProjects([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRecoverProject(code: string) {
    setRecovering(code);
    try {
      await recycleApi.recoverProject(code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "恢复失败");
    } finally {
      setRecovering(null);
    }
  }

  async function handleRecoverTask(code: string) {
    setRecovering(code);
    try {
      await recycleApi.recoverTask(code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "恢复失败");
    } finally {
      setRecovering(null);
    }
  }

  const total = tab === "projects" ? projects.length : tasks.length;

  return (
    <div className="space-y-4">
      <PageHeader description="恢复已删除的项目与任务" title="回收站" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-separator">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={clsx(
                "type-body px-4 py-2.5 -mb-px border-b-2 transition-colors",
                tab === t.key
                  ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
              type="button"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!loading ? <p className="type-meta">共 {total} 条</p> : null}
      </div>

      {tab === "tasks" ? (
        <Select
          aria-label="选择项目"
          className="max-w-sm"
          selectedKey={projectCode || null}
          onSelectionChange={(key) => setProjectCode(String(key))}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {allProjects.map((p) => (
                <ListBox.Item key={p.code} id={p.code} textValue={p.name}>
                  {p.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}

      {error ? (
        <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-separator">
          {tab === "projects" ? (
            <SimpleDataTable
              emptyHint="回收站暂无已删项目"
              headers={["项目名称", "编号", "删除时间", "操作"]}
              rows={projects.map((p) => ({
                key: p.code,
                cells: [
                  <span key="name" className="type-body font-medium">
                    {p.name || "（无名称）"}
                  </span>,
                  <code key="code" className="type-hint font-mono text-[0.6875rem]">
                    {p.code}
                  </code>,
                  <span key="time" className="type-body whitespace-nowrap text-subtle">
                    {formatListDate(pickDateField(p, "deleted_time", "deletedTime"))}
                  </span>,
                ],
                action: (
                  <Button
                    isPending={recovering === p.code}
                    size="sm"
                    variant="secondary"
                    onPress={() => void handleRecoverProject(p.code)}
                  >
                    恢复
                  </Button>
                ),
              }))}
            />
          ) : (
            <SimpleDataTable
              emptyHint={projectCode ? "该项目回收站为空" : "请先选择项目"}
              headers={["任务", "编号", "删除时间", "操作"]}
              rows={tasks.map((t) => ({
                key: t.code,
                cells: [
                  <span
                    key="name"
                    className={clsx(
                      "type-body font-medium",
                      !t.name?.trim() && "text-subtle italic",
                    )}
                  >
                    {taskDisplayTitle(t)}
                  </span>,
                  <code key="code" className="type-hint font-mono text-[0.6875rem]">
                    {t.code}
                  </code>,
                  <span key="time" className="type-body whitespace-nowrap text-subtle">
                    {formatListDateTime(
                      pickDateField(t, "deleted_time", "deletedTime") ??
                        pickDateField(t, "create_time", "createTime"),
                    )}
                  </span>,
                ],
                action: (
                  <Button
                    isPending={recovering === t.code}
                    size="sm"
                    variant="secondary"
                    onPress={() => void handleRecoverTask(t.code)}
                  >
                    恢复
                  </Button>
                ),
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
}
