import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Spinner } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import { fetchMyTasks } from "@/api/task";
import { fetchNoReads } from "@/api/notify";
import { ProjectCoverImage } from "@/components/project-cover-image";
import { ProjectGlyph } from "@/components/project-star";
import { PageHeader } from "@/components/typography";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { resolveProjectCoverUrl } from "@/config/assets";
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";
import type { ProjectSummary } from "@/types/api";

export default function WorkbenchPage() {
  const member = useAuthStore((s) => s.member);
  const projectsView = useLayoutStore((s) => s.recentProjectsView);
  const setProjectsView = useLayoutStore((s) => s.setRecentProjectsView);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [myTaskCount, setMyTaskCount] = useState<number | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSelfProjects(1, 6),
      fetchMyTasks(1, 1).catch(() => null),
      fetchNoReads().catch(() => null),
    ])
      .then(([proj, myTasks, noReads]) => {
        setProjects(proj.list ?? []);
        setMyTaskCount(myTasks?.total ?? null);
        setUnread(noReads?.total ?? noReads?.totalSum?.notice ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        description={`欢迎回来，${member?.name ?? "用户"}`}
        title="工作台"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="type-label">我的项目</p>
          <p className="type-heading-xlarge mt-2">{loading ? "—" : projects.length}</p>
        </Card>
        <Card className="p-4">
          <p className="type-label">我的待办</p>
          <p className="type-heading-xlarge mt-2">{loading ? "—" : (myTaskCount ?? "—")}</p>
          <Link className="type-hint text-accent hover:underline mt-2 inline-block" to="/my-tasks">
            查看任务
          </Link>
        </Card>
        <Card className="p-4">
          <p className="type-label">未读通知</p>
          <p className="type-heading-xlarge mt-2">{loading ? "—" : (unread ?? 0)}</p>
          <Link className="type-hint text-accent hover:underline mt-2 inline-block" to="/notifications">
            查看通知
          </Link>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="type-heading-small">最近项目</h3>
          <div className="flex items-center gap-3">
            <ViewModeToggle value={projectsView} onChange={setProjectsView} />
            <Link className="type-body text-accent hover:underline shrink-0" to="/projects">
              查看全部
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : projectsView === "card" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.code} to={`/project/${p.id ?? p.code}/overview`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  <ProjectCoverImage cover={p.cover} />
                  <div className="p-4">
                    <p className="type-body font-medium">{p.name}</p>
                    <p className="type-hint mt-1 line-clamp-2">
                      {p.description || "暂无简介"}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
            {!projects.length ? (
              <Card className="p-6 col-span-full text-center text-subtle">
                暂无项目，请先在 API 环境导入演示数据
              </Card>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-separator overflow-hidden rounded-lg border border-separator bg-surface">
            {projects.map((p) => (
              <li key={p.code}>
                <Link
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--ads-color-background-neutral)]"
                  to={`/project/${p.id ?? p.code}/overview`}
                >
                  <ProjectGlyph
                    className="size-10 shrink-0"
                    cover={resolveProjectCoverUrl(p.cover)}
                    name={p.name}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="type-body font-medium truncate">{p.name}</p>
                    <p className="type-hint mt-0.5 line-clamp-1">
                      {p.description || "暂无简介"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {!projects.length ? (
              <li className="px-4 py-8 text-center text-subtle type-body">
                暂无项目，请先在 API 环境导入演示数据
              </li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}
