import { isOk, http, post } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { ProjectDetail, ProjectSummary } from "@/types/api";

export async function fetchProject(projectCode: string) {
  const res = await post<ProjectDetail>("project/project/read", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取项目详情失败");
  return res.data;
}

export interface EditProjectPayload {
  name?: string;
  description?: string;
  cover?: string;
}

export async function editProject(projectCode: string, name: string, description = "") {
  return editProjectFields(projectCode, { name, description });
}

export async function editProjectFields(projectCode: string, fields: EditProjectPayload) {
  const res = await post("project/project/edit", { projectCode, ...fields });
  if (!isOk(res)) throw new Error(res.msg || "更新项目失败");
}

export async function uploadProjectCover(file: File) {
  const form = new FormData();
  form.append("cover", file);
  const response = await http.post<ApiResponse<{ url: string }>>(
    "project/project/uploadCover",
    form,
  );
  const body = response.data;
  body.code = Number(body.code);
  if (!isOk(body)) throw new Error(body.msg || "上传封面失败");
  const data = body.data;
  if (!data?.url) throw new Error("上传封面失败");
  return data;
}

export async function editProjectIssueKey(
  projectCode: string,
  prefix: string,
  openPrefix: boolean,
) {
  const res = await post("project/project/edit", {
    projectCode,
    prefix: prefix.trim().toUpperCase(),
    open_prefix: openPrefix ? 1 : 0,
  });
  if (!isOk(res)) throw new Error(res.msg || "更新 Issue Key 失败");
}

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
