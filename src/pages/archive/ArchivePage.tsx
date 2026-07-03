import { useCallback, useEffect, useState } from "react";
import { Button, Card, Spinner } from "@heroui/react";

import * as archiveApi from "@/api/archive";
import type { ProjectSummary } from "@/types/api";

export default function ArchivePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await archiveApi.fetchArchivedProjects();
      setProjects(data.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRecover(code: string) {
    try {
      await archiveApi.recoverArchivedProject(code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "恢复失败");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">归档项目</h2>
        <p className="text-sm text-muted mt-1">已归档项目可在此恢复</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.code} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">{p.code}</p>
              </div>
              <Button size="sm" onPress={() => handleRecover(p.code)}>
                取消归档
              </Button>
            </Card>
          ))}
          {!projects.length ? (
            <Card className="p-8 text-center text-muted">暂无归档项目</Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
