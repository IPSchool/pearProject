import { isOk, post } from "@/api/client";
import type { ProjectSummary } from "@/types/api";

export async function fetchArchivedProjects(page = 1, pageSize = 20) {
  const res = await post<{ list: ProjectSummary[]; total: number }>("project/project/index", {
    selectBy: "archive",
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取归档项目失败");
  return res.data;
}

export async function archiveProject(projectCode: string) {
  const res = await post("project/project/archive", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "归档失败");
}

export async function recoverArchivedProject(projectCode: string) {
  const res = await post("project/project/recoveryArchive", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "取消归档失败");
}
