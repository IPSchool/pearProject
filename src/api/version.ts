import { isOk, post } from "@/api/client";

export interface ProjectVersion {
  code: string;
  name: string;
  description?: string;
  status?: number;
  start_time?: string;
  plan_publish_time?: string;
  publish_time?: string;
  features_code?: string;
  project_code?: string;
}

export async function fetchVersions(projectFeaturesCode: string) {
  const res = await post<ProjectVersion[]>("project/projectVersion/index", {
    projectFeaturesCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取版本失败");
  const list = Array.isArray(res.data) ? res.data : [];
  return { list, total: list.length };
}

export async function createVersion(
  featuresCode: string,
  name: string,
  description = "",
  startTime = "",
  planPublishTime = "",
) {
  const res = await post<{ code: string }>("project/projectVersion/save", {
    featuresCode,
    name,
    description,
    startTime,
    planPublishTime,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建版本失败");
  return res.data;
}

export async function fetchVersion(versionCode: string) {
  const res = await post<ProjectVersion>("project/projectVersion/read", { versionCode });
  if (!isOk(res)) throw new Error(res.msg || "获取版本详情失败");
  return res.data;
}
