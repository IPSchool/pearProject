import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Chip, Spinner } from "@heroui/react";

import * as analysisApi from "@/api/analysis";
import { fetchSelfProjects } from "@/api/project";
import { fetchNoReads } from "@/api/notify";
import { useAuthStore } from "@/stores/auth";
import type { ProjectSummary } from "@/types/api";

export default function WorkbenchPage() {
  const member = useAuthStore((s) => s.member);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSelfProjects(1, 6),
      analysisApi.fetchProjectAnalysis().catch(() => null),
      fetchNoReads().catch(() => null),
    ])
      .then(([proj, analysis, noReads]) => {
        setProjects(proj.list ?? []);
        setTaskCount(analysis?.taskCount ?? null);
        setUnread(noReads?.total ?? noReads?.totalSum?.notice ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">工作台</h2>
        <p className="text-muted mt-1">欢迎回来，{member?.name ?? "用户"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted">我的项目</p>
          <p className="text-3xl font-bold mt-2">{loading ? "—" : projects.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">组织任务</p>
          <p className="text-3xl font-bold mt-2">{loading ? "—" : (taskCount ?? "—")}</p>
          <Link className="text-xs text-accent hover:underline mt-2 inline-block" to="/my-tasks">
            我的任务
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">未读通知</p>
          <p className="text-3xl font-bold mt-2">{loading ? "—" : (unread ?? 0)}</p>
          <Link className="text-xs text-accent hover:underline mt-2 inline-block" to="/notifications">
            查看通知
          </Link>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium">最近项目</h3>
          <Link className="text-sm text-accent hover:underline" to="/projects">
            查看全部
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.code} to={`/project/${p.code}/tasks`}>
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {p.description || "暂无简介"}
                  </p>
                </Card>
              </Link>
            ))}
            {!projects.length ? (
              <Card className="p-6 col-span-full text-center text-muted">
                暂无项目，请先在 API 环境导入演示数据
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-lg font-medium">快捷入口</h3>
          <Chip size="sm" variant="soft">
            Phase 5
          </Chip>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="text-sm text-accent hover:underline" to="/events">
            日程管理
          </Link>
          <Link className="text-sm text-accent hover:underline" to="/analytics">
            数据分析
          </Link>
        </div>
      </section>
    </div>
  );
}
