import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, InputGroup, Label, ListBox, Select, Spinner, TextField } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import { searchTasks } from "@/api/task";
import type { TaskItem } from "@/types/api";
import type { ProjectSummary } from "@/types/api";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
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

  async function runSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchTasks(keyword.trim(), projectCode || undefined);
      setResults(data.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">任务搜索</h2>
        <p className="text-sm text-muted mt-1">Legacy `task/index` + keyword</p>
      </div>

      <Card className="p-4 space-y-4">
        <TextField name="keyword">
          <Label>关键词</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="任务名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
          </InputGroup>
        </TextField>
        <Select
          aria-label="项目筛选"
          selectedKey={projectCode || "all"}
          onSelectionChange={(key) => setProjectCode(key === "all" ? "" : String(key))}
        >
          <Select.Trigger className="max-w-md">
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
          className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground"
          type="button"
          onClick={runSearch}
        >
          搜索
        </button>
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
