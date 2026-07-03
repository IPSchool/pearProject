import { isOk, post } from "@/api/client";

export async function createTaskStage(projectCode: string, name: string) {
  const res = await post<{ code: string }>("project/taskStages/save", { projectCode, name });
  if (!isOk(res)) throw new Error(res.msg || "创建看板列失败");
  return res.data;
}

export async function editTaskStage(stageCode: string, name: string) {
  const res = await post("project/taskStages/edit", { stageCode, name });
  if (!isOk(res)) throw new Error(res.msg || "编辑看板列失败");
}

export async function deleteTaskStage(stageCode: string) {
  const res = await post("project/taskStages/delete", { code: stageCode });
  if (!isOk(res)) throw new Error(res.msg || "删除看板列失败");
}
