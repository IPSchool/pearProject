import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, InputGroup, Spinner, TextField } from "@heroui/react";

import { fetchProjectMembers } from "@/api/member";
import { createTask } from "@/api/task";
import { ListColumnSettings } from "@/components/project/list-column-settings";
import { listColumnHeader, TaskListRow } from "@/components/project/task-list-row";
import {
  loadVisibleColumns,
  type ListColumnKey,
  LIST_COLUMNS,
} from "@/lib/list-view-columns";
import { useProjectRoute } from "@/contexts/project-context";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import type { ProjectMember } from "@/types/api";

export default function ProjectListViewPage() {
  const { apiCode, pathId, projectId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const { tasks, stages, loading, error, reload } = useProjectTasks(projectCode);
  const [keyword, setKeyword] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ListColumnKey[]>(() =>
    loadVisibleColumns(projectCode),
  );

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns(projectCode));
  }, [projectCode]);

  const loadMembers = useCallback(async () => {
    try {
      const data = await fetchProjectMembers(projectCode, 1, 100);
      setMembers(data.list ?? []);
    } catch {
      setMembers([]);
    }
  }, [projectCode]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.executor?.name ?? "").toLowerCase().includes(q) ||
        (t.creator?.name ?? "").toLowerCase().includes(q),
    );
  }, [tasks, keyword]);

  const visibleDefs = LIST_COLUMNS.filter((c) => visibleColumns.includes(c.key));

  async function handleCreate() {
    const name = newName.trim();
    if (!name || !stages[0]?.code) return;
    setCreating(true);
    try {
      await createTask(projectCode, stages[0].code, name);
      setNewName("");
      await reload();
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TextField className="max-w-sm" name="search">
          <InputGroup>
            <InputGroup.Input
              placeholder="搜索工作项"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </InputGroup>
        </TextField>
        <div className="flex items-center gap-2">
          <p className="type-meta">
            {filtered.length} 个，共 {tasks.length} 个
          </p>
          <Button size="sm" variant="secondary" onPress={() => setColumnsOpen(true)}>
            列配置
          </Button>
        </div>
      </div>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <div className="overflow-x-auto rounded-lg border border-separator">
        <table className="min-w-full text-left">
          <thead className="border-b border-separator bg-surface-sunken">
            <tr>
              {visibleDefs.map((col) => (
                <th key={col.key} className="type-label px-4 py-3 font-medium">
                  {listColumnHeader(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <TaskListRow
                key={task.code}
                members={members}
                projectId={projectId ?? pathId}
                task={task}
                visibleColumns={visibleColumns}
                onUpdated={reload}
              />
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="p-8 text-center type-meta">暂无工作项</p>
        ) : null}
        <div className="flex items-center gap-2 border-t border-separator bg-surface-sunken px-4 py-3">
          <TextField className="max-w-md flex-1" name="newTask">
            <InputGroup>
              <InputGroup.Input
                placeholder="输入标题后回车创建"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
              />
            </InputGroup>
          </TextField>
          <Button isDisabled={creating || !newName.trim()} size="sm" onPress={() => void handleCreate()}>
            + 创建
          </Button>
        </div>
      </div>

      <ListColumnSettings
        open={columnsOpen}
        projectCode={projectCode}
        visible={visibleColumns}
        onChange={setVisibleColumns}
        onOpenChange={setColumnsOpen}
      />
    </div>
  );
}
