import { isOk, post } from "@/api/client";

export interface TaskWorkflow {
  code: string;
  name: string;
  project_code?: string;
}

export async function fetchWorkflows(projectCode: string) {
  const res = await post<TaskWorkflow[] | { list: TaskWorkflow[] }>(
    "project/taskWorkflow/index",
    { projectCode },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取工作流失败");
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data.list ?? [];
}

export async function fetchWorkflowRules(projectCode: string) {
  const res = await post<unknown>("project/taskWorkflow/_getTaskWorkflowRules", {
    projectCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取工作流规则失败");
  return res.data;
}

export async function createWorkflow(projectCode: string, name: string) {
  const res = await post<{ code: string }>("project/taskWorkflow/save", {
    projectCode,
    name,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建工作流失败");
  return res.data;
}
