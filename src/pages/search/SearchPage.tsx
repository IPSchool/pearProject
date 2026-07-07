import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, InputGroup, ListBox, Select, Spinner, TextField } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import { searchTasks } from "@/api/task";
import { PageHeader } from "@/components/typography";
import type { TaskItem } from "@/types/api";
import type { ProjectSummary } from "@/types/api";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [keyword, setKeyword] = useState(initialQ);
  const [projectCode, setProjectCode] = useState("");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [results, setResults] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSelfProjects(1, 50)
      .then((d) => setProjects(d.list ?? []))
      .catch(() => setProjects([]));
  }, []);

  const runSearch = useCallback(
    async (qOverride?: string) => {
      const q = (qOverride ?? keyword).trim();
      if (!q) return;
      setLoading(true);
      setError(null);
      try {
        const data = await searchTasks(q, projectCode || undefined);
        setResults(data.list ?? []);
        if (qOverride === undefined) {
          setSearchParams({ q });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "搜索失败");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [keyword, projectCode, setSearchParams],
  );

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setKeyword(q);
    if (q.trim()) void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅随 URL 查询参数触发
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader description="Legacy `task/index` + keyword" title="任务搜索" />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <TextField className="min-w-[12rem] flex-1" name="keyword">
            <InputGroup>
              <InputGroup.Input
                aria-label="关键词"
                placeholder="任务名称"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              />
            </InputGroup>
          </TextField>
          <Select
            aria-label="项目筛选"
            selectedKey={projectCode || "all"}
            onSelectionChange={(key) => setProjectCode(key === "all" ? "" : String(key))}
          >
            <Select.Trigger className="w-44 shrink-0">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="全部项目">
                  全部项目
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {projects.map((p) => (
                  <ListBox.Item key={p.code} id={p.code} textValue={p.name}>
                    {p.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground"
            type="button"
            onClick={() => void runSearch()}
          >
            搜索
          </button>
        </div>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((task) => (
            <Card key={task.code} className="p-4">
              <Link
                className="font-medium hover:text-accent"
                to={`/project/${task.project_code}/tasks`}
              >
                {task.name}
              </Link>
              <p className="text-xs text-muted mt-1">{task.code}</p>
            </Card>
          ))}
          {keyword && !loading && !results.length ? (
            <Card className="p-8 text-center text-muted">无匹配任务</Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
