import { isOk, post } from "@/api/client";
import type { ProjectInfoBlock } from "@/types/api";

export type { ProjectInfoBlock };

export async function fetchProjectInfoBlocks(projectCode: string) {
  const res = await post<ProjectInfoBlock[]>("project/projectInfo/index", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取项目信息失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createProjectInfoBlock(
  projectCode: string,
  name: string,
  value = "",
  description = "",
) {
  const res = await post<{ code: string }>("project/projectInfo/save", {
    projectCode,
    name,
    value,
    description,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建信息块失败");
  return res.data;
}

export async function deleteProjectInfoBlock(infoCode: string) {
  const res = await post("project/projectInfo/delete", { infoCode });
  if (!isOk(res)) throw new Error(res.msg || "删除信息块失败");
}
