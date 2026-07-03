import { isOk, post } from "@/api/client";
import type { TaskStagesTemplate } from "@/types/api";

export type { TaskStagesTemplate };

export async function fetchTaskStagesTemplates(templateCode: string) {
  const res = await post<{ list: TaskStagesTemplate[]; total: number } | TaskStagesTemplate[]>(
    "project/taskStagesTemplate/index",
    { code: templateCode },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取看板模板失败");
  if (Array.isArray(res.data)) return { list: res.data, total: res.data.length };
  return { list: res.data.list ?? [], total: res.data.total ?? 0 };
}

export async function createTaskStagesTemplate(templateCode: string, name: string, sort = 0) {
  const res = await post<{ code: string }>("project/taskStagesTemplate/save", {
    template_code: templateCode,
    name,
    sort,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建看板模板失败");
  return res.data;
}
