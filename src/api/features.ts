import { isOk, post } from "@/api/client";

export interface ProjectFeature {
  code: string;
  name: string;
  description?: string;
  project_code?: string;
}

export async function fetchFeatures(projectCode: string) {
  const res = await post<ProjectFeature[]>("project/projectFeatures/index", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取版本库失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createFeature(projectCode: string, name: string, description = "") {
  const res = await post<{ code: string }>("project/projectFeatures/save", {
    projectCode,
    name,
    description,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建版本库失败");
  return res.data;
}
