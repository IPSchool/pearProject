import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Spinner } from "@heroui/react";

import { fetchSelfProjects } from "@/api/project";
import type { ProjectSummary } from "@/types/api";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSelfProjects(1, 50)
      .then((data) => setProjects(data.list ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

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
            <Link key={project.code} to={`/project/${project.code}/tasks`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                {project.cover ? (
                  <img
                    alt=""
                    className="h-28 w-full object-cover"
                    src={project.cover}
                  />
                ) : (
                  <div className="h-28 bg-accent/10" />
                )}
                <div className="p-4">
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-muted mt-1 line-clamp-2">
                    {project.description || "暂无简介"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
          {!projects.length ? (
            <Card className="p-8 col-span-full text-center text-muted">
              暂无项目
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
