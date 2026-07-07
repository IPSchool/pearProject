import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";
import clsx from "clsx";

import * as archiveApi from "@/api/archive";
import { fetchCollectedProjects } from "@/api/collect";
import { fetchSelfProjects } from "@/api/project";
import { ProjectCoverImage } from "@/components/project-cover-image";
import { ProjectStarButton } from "@/components/project-star";
import { PageHeader } from "@/components/typography";
import { useStarredProjectsStore } from "@/stores/starred-projects";
import type { ProjectSummary } from "@/types/api";

type ProjectView = "all" | "starred";

export default function ProjectListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ProjectView = searchParams.get("view") === "starred" ? "starred" : "all";

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  const setCollected = useStarredProjectsStore((s) => s.setCollected);
  const reloadStarred = useStarredProjectsStore((s) => s.load);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        view === "starred"
          ? await fetchCollectedProjects(1, 50)
          : await fetchSelfProjects(1, 50);
      setProjects(data.list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function switchView(next: ProjectView) {
    if (next === "starred") {
      setSearchParams({ view: "starred" });
    } else {
      setSearchParams({});
    }
  }

  async function toggleCollect(project: ProjectSummary) {
    try {
      const next = !project.collected;
      await setCollected(project.code, next);
      if (view === "starred" && !next) {
        setProjects((prev) => prev.filter((p) => p.code !== project.code));
      } else {
        setProjects((prev) =>
          prev.map((p) => (p.code === project.code ? { ...p, collected: next ? 1 : 0 } : p)),
        );
      }
      if (view === "all") {
        await reloadStarred();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "收藏失败");
    }
  }

  async function handleArchive(project: ProjectSummary) {
    setArchiving(project.code);
    try {
      await archiveApi.archiveProject(project.code);
      setProjects((prev) => prev.filter((p) => p.code !== project.code));
      await reloadStarred();
    } catch (err) {
      setError(err instanceof Error ? err.message : "归档失败");
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={
          view === "starred"
            ? "你加星收藏的项目，可在侧栏「已加星」快速访问。"
            : "当前组织内、你作为成员且未归档的项目；不含仅被指派任务但未加入成员的项目。"
        }
        title={view === "starred" ? "已加星项目" : "项目"}
      />

      <div className="flex gap-0 border-b border-separator">
        {(
          [
            { key: "all" as const, label: "全部项目" },
            { key: "starred" as const, label: "已加星" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            className={clsx(
              "type-body px-4 py-2.5 -mb-px border-b-2 transition-colors",
              view === tab.key
                ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                : "border-transparent text-subtle hover:text-foreground",
            )}
            type="button"
            onClick={() => switchView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
                <Link to={`/project/${project.id ?? project.code}/overview`}>
                  <ProjectCoverImage cover={project.cover} />
                </Link>
                <ProjectStarButton
                  className="absolute top-2 right-2 bg-surface/90 shadow-sm"
                  collected={Boolean(project.collected)}
                  onPress={() => toggleCollect(project)}
                />
              </div>
              <Link className="block p-4" to={`/project/${project.id ?? project.code}/overview`}>
                <p className="type-body font-semibold">{project.name}</p>
                <p className="type-meta mt-1 line-clamp-2">
                  {project.description || "暂无简介"}
                </p>
              </Link>
              {view === "all" ? (
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
              ) : null}
            </Card>
          ))}
          {!projects.length ? (
            <Card className="p-8 col-span-full text-center text-subtle">
              {view === "starred" ? "暂无已加星项目，可在全部项目中点击星标收藏" : "暂无项目"}
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
