import { isOk, post } from "@/api/client";
import type { TaskTagItem } from "@/types/api";

export type { TaskTagItem };

export async function fetchTaskTags(projectCode: string) {
  const res = await post<TaskTagItem[]>("project/taskTag/index", { projectCode });
  if (!isOk(res)) throw new Error(res.msg || "获取标签失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createTaskTag(projectCode: string, name: string, color = "blue") {
  const res = await post<{ code: string }>("project/taskTag/save", { projectCode, name, color });
  if (!isOk(res)) throw new Error(res.msg || "创建标签失败");
  return res.data;
}

export async function deleteTaskTag(tagCode: string) {
  const res = await post("project/taskTag/delete", { tagCode });
  if (!isOk(res)) throw new Error(res.msg || "删除标签失败");
}

export async function toggleTaskTag(taskCode: string, tagCode: string) {
  const res = await post("project/task/setTag", { taskCode, tagCode });
  if (!isOk(res)) throw new Error(res.msg || "设置标签失败");
}

/** @deprecated 使用 toggleTaskTag — Legacy API 每次只切换单个 tagCode */
export async function setTaskTags(taskCode: string, tagCodes: string[]) {
  for (const tagCode of tagCodes) {
    await toggleTaskTag(taskCode, tagCode);
  }
}

export async function fetchTaskTagsForTask(taskCode: string) {
  const res = await post<TaskTagItem[]>("project/task/taskToTags", { taskCode });
  if (!isOk(res)) throw new Error(res.msg || "获取任务标签失败");
  return Array.isArray(res.data) ? res.data : [];
}
