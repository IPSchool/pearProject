import { useCallback, useEffect, useState } from "react";

import { fetchProjectTasks, fetchTaskStages } from "@/api/task";
import type { TaskItem, TaskStage } from "@/types/api";

export function useProjectTasks(projectCode: string, memberCode = "") {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!projectCode) return;
    setLoading(true);
    setError(null);
    try {
      const [stageList, taskData] = await Promise.all([
        fetchTaskStages(projectCode),
        fetchProjectTasks(projectCode, 1, 500, memberCode || undefined),
      ]);
      setStages(stageList);
      setTasks(taskData.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setTasks([]);
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [projectCode, memberCode]);

  useEffect(() => {
    reload();
  }, [reload]);

  const stageMap = Object.fromEntries(stages.map((s) => [s.code, s.name]));

  return { tasks, stages, stageMap, loading, error, reload };
}

export function formatTaskDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTaskDay(value?: string) {
  if (!value) return "";
  const d = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function priorityLabel(pri?: number) {
  if (pri === 1) return "紧急";
  if (pri === 2) return "非常紧急";
  return "普通";
}
