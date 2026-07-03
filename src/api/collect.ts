import { isOk, post } from "@/api/client";

export async function setProjectCollect(projectCode: string, collect: boolean) {
  const res = await post("project/projectCollect/collect", {
    projectCode,
    type: collect ? "collect" : "cancel",
  });
  if (!isOk(res)) throw new Error(res.msg || "收藏操作失败");
}

export async function fetchCollectedProjects(page = 1, pageSize = 20) {
  const res = await post<{ list: unknown[]; total: number }>("project/project/index", {
    selectBy: "collect",
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取收藏项目失败");
  return res.data;
}
