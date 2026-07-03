import { isOk, post } from "@/api/client";
import type { ProjectSummary } from "@/types/api";

export async function fetchDeletedProjects(page = 1, pageSize = 20) {
  const res = await post<{ list: ProjectSummary[]; total: number }>("project/project/index", {
    selectBy: "deleted",
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取回收站项目失败");
  return res.data;
}

export async function recoverProject(projectCode: string) {
  const res = await post("project/project/recovery", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "恢复项目失败");
}

export async function fetchDeletedTasks(projectCode: string, page = 1, pageSize = 50) {
  const res = await post<{ list: Array<{ code: string; name: string }>; total: number }>(
    "project/task/index",
    { projectCode, deleted: 1, page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取回收站任务失败");
  return res.data;
}

export async function recoverTask(taskCode: string) {
  const res = await post("project/task/recovery", { taskCode });
  if (!isOk(res)) throw new Error(res.msg || "恢复任务失败");
}

export async function recycleTask(taskCode: string) {
  const res = await post("project/task/recycle", { taskCode });
  if (!isOk(res)) throw new Error(res.msg || "移入回收站失败");
}
