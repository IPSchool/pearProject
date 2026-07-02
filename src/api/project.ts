import { isOk, post } from "@/api/client";
import type { ProjectSummary } from "@/types/api";

export async function fetchSelfProjects(page = 1, pageSize = 20) {
  const res = await post<{ list: ProjectSummary[]; total: number }>(
    "project/project/selfList",
    { page, pageSize },
  );
  if (!isOk(res)) {
    throw new Error(res.msg || "获取项目列表失败");
  }
  return res.data;
}

export async function createProject(name: string, description = "") {
  const res = await post<{ code: string }>("project/project/save", {
    name,
    description,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "创建项目失败");
  }
  return res.data;
}
