import { isOk, post } from "@/api/client";

export interface ProjectTemplate {
  code: string;
  name: string;
  description?: string;
  cover?: string;
  organization_code?: string;
}

export async function fetchTemplates(page = 1, pageSize = 20) {
  const res = await post<{ list: ProjectTemplate[]; total: number }>(
    "project/projectTemplate/index",
    { page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取模板失败");
  return res.data;
}

export async function createTemplate(name: string, description = "") {
  const res = await post<{ code: string }>("project/projectTemplate/save", {
    name,
    description,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建模板失败");
  return res.data;
}
