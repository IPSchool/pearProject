import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";

import * as archiveApi from "@/api/archive";
import { setProjectCollect } from "@/api/collect";
import { fetchSelfProjects } from "@/api/project";
import type { ProjectSummary } from "@/types/api";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  useEffect(() => {
    fetchSelfProjects(1, 50)
      .then((data) => setProjects(data.list ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleCollect(project: ProjectSummary) {
    setCollecting(project.code);
    try {
      const next = !project.collected;
      await setProjectCollect(project.code, next);
      setProjects((prev) =>
        prev.map((p) => (p.code === project.code ? { ...p, collected: next ? 1 : 0 } : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "收藏失败");
    } finally {
      setCollecting(null);
    }
  }

  async function handleArchive(project: ProjectSummary) {
    setArchiving(project.code);
    try {
      await archiveApi.archiveProject(project.code);
      setProjects((prev) => prev.filter((p) => p.code !== project.code));
    } catch (err) {
      setError(err instanceof Error ? err.message : "归档失败");
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">项目</h2>
        <p className="text-muted mt-1">我参与的项目列表（对接 Legacy selfList）</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="p-6 text-danger">{error}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.code} className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <div className="relative">
                <Link to={`/project/${project.code}/overview`}>
                  {project.cover ? (
                    <img alt="" className="h-28 w-full object-cover" src={project.cover} />
                  ) : (
                    <div className="h-28 bg-accent/10" />
                  )}
                </Link>
                <Button
                  className="absolute top-2 right-2 min-w-0 px-2"
                  isPending={collecting === project.code}
                  size="sm"
                  variant="tertiary"
                  onPress={() => toggleCollect(project)}
                >
                  {project.collected ? "★" : "☆"}
                </Button>
              </div>
              <Link className="block p-4" to={`/project/${project.code}/overview`}>
                <p className="font-semibold">{project.name}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">
                  {project.description || "暂无简介"}
                </p>
              </Link>
              <div className="px-4 pb-4">
                <Button
                  isPending={archiving === project.code}
                  size="sm"
                  variant="tertiary"
                  onPress={() => handleArchive(project)}
                >
                  归档
                </Button>
              </div>
            </Card>
          ))}
          {!projects.length ? (
            <Card className="p-8 col-span-full text-center text-muted">暂无项目</Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
