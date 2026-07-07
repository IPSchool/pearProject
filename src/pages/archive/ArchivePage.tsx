import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";

import * as archiveApi from "@/api/archive";
import { SimpleDataTable } from "@/components/simple-data-table";
import { PageHeader } from "@/components/typography";
import { formatListDate, pickDateField } from "@/lib/datetime";
import type { ProjectSummary } from "@/types/api";

type ArchivedProject = ProjectSummary & { archive_time?: string };

export default function ArchivePage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await archiveApi.fetchArchivedProjects(1, 100);
      setProjects((data.list ?? []) as ArchivedProject[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRecover(code: string) {
    setRecovering(code);
    try {
      await archiveApi.recoverArchivedProject(code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "恢复失败");
    } finally {
      setRecovering(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader description="已归档项目可在此恢复为活跃项目" title="归档" />
        {!loading ? <p className="type-meta pb-1">共 {projects.length} 个项目</p> : null}
      </div>

      {error ? (
        <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-separator">
          <SimpleDataTable
            emptyHint="暂无归档项目"
            headers={["项目名称", "编号", "归档时间", "操作"]}
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
                  {formatListDate(pickDateField(p, "archive_time", "archiveTime"))}
                </span>,
              ],
              action: (
                <Button
                  isPending={recovering === p.code}
                  size="sm"
                  variant="secondary"
                  onPress={() => void handleRecover(p.code)}
                >
                  取消归档
                </Button>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
}
