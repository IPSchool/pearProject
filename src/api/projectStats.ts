import { isOk, post } from "@/api/client";

export interface ProjectTaskStats {
  total: number;
  unDone: number;
  done: number;
  overdue: number;
  toBeAssign: number;
  expireToday: number;
  doneOverdue: number;
}

export interface ProjectActivity7d {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
}

export interface ProjectStageBreakdown {
  stageCode: string;
  stageName: string;
  count: number;
}

export interface ProjectPriorityBreakdown {
  pri: number;
  label: string;
  count: number;
}

export interface ProjectStatusBreakdown {
  status: number;
  label: string;
  count: number;
}

export interface ProjectRecentActivity {
  id: number;
  taskCode: string;
  taskName: string;
  type: string;
  remark: string;
  content: string;
  createTime: string;
  member: { name?: string; avatar?: string; code?: string };
  isComment: number;
}

export interface ProjectOverviewWidgets {
  activity7d: ProjectActivity7d;
  stageBreakdown: ProjectStageBreakdown[];
  priorityBreakdown: ProjectPriorityBreakdown[];
  statusBreakdown: ProjectStatusBreakdown[];
  recentActivity: ProjectRecentActivity[];
}

export async function fetchProjectTaskStats(projectCode: string) {
  const res = await post<ProjectTaskStats>("project/project/_projectStats", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取项目统计失败");
  return res.data;
}

export async function fetchProjectOverview(projectCode: string) {
  const res = await post<ProjectOverviewWidgets>("project/project/_projectOverview", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取项目摘要失败");
  return res.data;
}
