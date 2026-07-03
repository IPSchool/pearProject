import { useCallback, useEffect, useState } from "react";
import { Button, Card, ListBox, Select, Spinner } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import * as recycleApi from "@/api/recycle";
import type { ProjectSummary } from "@/types/api";

const tabs = [
  { key: "projects", label: "已删项目" },
  { key: "tasks", label: "已删任务" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function RecycleBinPage() {
  const [tab, setTab] = useState<TabKey>("projects");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [projectCode, setProjectCode] = useState("");
  const [tasks, setTasks] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "projects") {
        const data = await recycleApi.fetchDeletedProjects();
        setProjects(data.list ?? []);
      } else if (projectCode) {
        const data = await recycleApi.fetchDeletedTasks(projectCode);
        setTasks(data.list ?? []);
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
    load();
  }, [load]);

  async function handleRecoverProject(code: string) {
    await recycleApi.recoverProject(code);
    await load();
  }

  async function handleRecoverTask(code: string) {
    await recycleApi.recoverTask(code);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">回收站</h2>
        <p className="text-sm text-muted mt-1">恢复已删除的项目与任务</p>
      </div>

      <div className="flex gap-1 border-b border-separator">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent font-medium"
                : "border-transparent text-muted hover:text-foreground"
            }`}
            type="button"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" ? (
        <Select
          aria-label="项目"
          selectedKey={projectCode}
          onSelectionChange={(key) => setProjectCode(String(key))}
        >
          <Select.Trigger className="max-w-sm">
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : tab === "projects" ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.code} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">{p.code}</p>
              </div>
              <Button size="sm" onPress={() => handleRecoverProject(p.code)}>
                恢复
              </Button>
            </Card>
          ))}
          {!projects.length ? <Card className="p-8 text-center text-muted">回收站无项目</Card> : null}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Card key={t.code} className="p-4 flex justify-between items-center">
              <p className="font-medium">{t.name}</p>
              <Button size="sm" onPress={() => handleRecoverTask(t.code)}>
                恢复
              </Button>
            </Card>
          ))}
          {!tasks.length ? (
            <Card className="p-8 text-center text-muted">该项目无已删任务</Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
