import { isOk, post } from "@/api/client";
import type { TaskItem } from "@/types/api";

import { createFeature, fetchFeatures } from "@/api/features";
import type { ProjectVersion } from "@/api/version";
import { createVersion, fetchVersion } from "@/api/version";

export type Milestone = ProjectVersion & {
  statusText?: string;
  schedule?: number;
  task_total?: number;
  task_done?: number;
};

export async function ensureMilestoneGroup(projectCode: string) {
  const res = await post<{ code: string }>("project/projectFeatures/ensureDefault", {
    projectCode,
  });
  if (isOk(res) && res.data?.code) return res.data;
  const list = await fetchFeatures(projectCode);
  if (list[0]?.code) return { code: list[0].code };
  return createFeature(projectCode, "里程碑");
}

export async function fetchProjectMilestones(projectCode: string) {
  const res = await post<Milestone[]>("project/projectVersion/indexByProject", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取里程碑失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMilestone(
  projectCode: string,
  name: string,
  options: { description?: string; planPublishTime?: string; startTime?: string } = {},
) {
  const group = await ensureMilestoneGroup(projectCode);
  if (!group?.code) throw new Error("无法初始化里程碑分组");
  return createVersion(
    group.code,
    name,
    options.description ?? "",
    options.startTime ?? "",
    options.planPublishTime ?? "",
  );
}

export async function fetchMilestoneDetail(milestoneCode: string) {
  return fetchVersion(milestoneCode);
}

export async function fetchMilestoneTasks(milestoneCode: string) {
  const res = await post<TaskItem[]>("project/projectVersion/_getVersionTask", {
    versionCode: milestoneCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取里程碑工作项失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function changeMilestoneStatus(milestoneCode: string, status: number) {
  const res = await post("project/projectVersion/changeStatus", {
    versionCode: milestoneCode,
    status,
  });
  if (!isOk(res)) throw new Error(res.msg || "更新状态失败");
}

export async function assignTaskToMilestone(taskCode: string, milestoneCode: string) {
  const res = await post("project/projectVersion/addVersionTask", {
    versionCode: milestoneCode,
    taskCodeList: JSON.stringify([taskCode]),
  });
  if (!isOk(res)) throw new Error(res.msg || "纳入里程碑失败");
}

export async function removeTaskFromMilestone(taskCode: string) {
  const res = await post("project/projectVersion/removeVersionTask", { taskCode });
  if (!isOk(res)) throw new Error(res.msg || "移出里程碑失败");
}

export async function setTaskMilestone(taskCode: string, milestoneCode: string | null) {
  if (!milestoneCode) {
    await removeTaskFromMilestone(taskCode);
    return;
  }
  try {
    await assignTaskToMilestone(taskCode, milestoneCode);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("已被关联") || msg.includes("关联")) {
      await removeTaskFromMilestone(taskCode);
      await assignTaskToMilestone(taskCode, milestoneCode);
      return;
    }
    throw e;
  }
}
