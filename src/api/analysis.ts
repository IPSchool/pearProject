import { isOk, post } from "@/api/client";

export interface ChartPoint {
  日期: string;
  数量?: number;
  任务?: number;
}

export interface ProjectAnalysis {
  projectList: ChartPoint[];
  projectCount: number;
  projectSchedule: number;
  taskList: ChartPoint[];
  taskCount: number;
  taskOverdueCount: number;
  taskOverduePercent: number;
}

export async function fetchProjectAnalysis() {
  const res = await post<ProjectAnalysis>("project/project/analysis", {});
  if (!isOk(res)) throw new Error(res.msg || "获取统计数据失败");
  return res.data;
}
