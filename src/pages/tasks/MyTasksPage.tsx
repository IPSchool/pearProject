import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Spinner } from "@heroui/react";

import { fetchMyTasks } from "@/api/task";
import type { TaskItem } from "@/types/api";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks(1, 50)
      .then((d) => setTasks(d.list ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">我的任务</h2>
        <p className="text-sm text-muted mt-1">`task/selfList` 未完成项</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <Card className="p-6 text-danger">{error}</Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.code} className="p-4">
              <Link
                className="font-medium hover:text-accent"
                to={t.project_code ? `/project/${t.project_code}/tasks` : "/projects"}
              >
                {t.name}
              </Link>
              <p className="text-xs text-muted mt-1">{t.priText ?? ""} · {t.end_time ?? "无截止"}</p>
            </Card>
          ))}
          {!tasks.length ? <Card className="p-8 text-center text-muted">暂无待办任务</Card> : null}
        </div>
      )}
    </div>
  );
}
