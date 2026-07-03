import { isOk, post } from "@/api/client";
import type { TaskItem, TaskStage, TaskLogItem, TaskWorkTimeItem } from "@/types/api";

export type { TaskLogItem, TaskWorkTimeItem };

export async function fetchTaskStages(projectCode: string) {
  const res = await post<{ list: TaskStage[] } | TaskStage[]>(
    "project/taskStages/index",
    { projectCode },
  );
  if (!isOk(res)) {
    throw new Error(res.msg || "获取看板列失败");
  }
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data.list ?? [];
}

export async function fetchStageTasks(stageCode: string, page = 1, pageSize = 50) {
  const res = await post<TaskItem[]>("project/taskStages/tasks", {
    stageCode,
    page,
    pageSize,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "获取任务失败");
  }
  return res.data ?? [];
}

export async function createTask(
  projectCode: string,
  stageCode: string,
  name: string,
) {
  const res = await post<{ code: string }>("project/task/save", {
    name,
    project_code: projectCode,
    stage_code: stageCode,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "创建任务失败");
  }
  return res.data;
}

export async function fetchTask(taskCode: string) {
  const res = await post<TaskItem>("project/task/read", { taskCode });
  if (!isOk(res)) {
    throw new Error(res.msg || "获取任务详情失败");
  }
  return res.data;
}

export async function markTaskDone(taskCode: string, done = 1) {
  const res = await post("project/task/taskDone", { taskCode, done });
  if (!isOk(res)) {
    throw new Error(res.msg || "更新任务状态失败");
  }
}

export async function sortTask(
  preTaskCode: string,
  toStageCode: string,
  nextTaskCode = "",
) {
  const res = await post("project/task/sort", {
    preTaskCode,
    nextTaskCode,
    toStageCode,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "移动任务失败");
  }
}

export async function createComment(taskCode: string, comment: string) {
  const res = await post("project/task/createComment", { taskCode, comment });
  if (!isOk(res)) {
    throw new Error(res.msg || "评论失败");
  }
}

export async function fetchTaskComments(taskCode: string) {
  const res = await post<{ list: TaskLogItem[]; total: number }>("project/task/taskLog", {
    taskCode,
    comment: 1,
    page: 1,
    pageSize: 50,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "获取评论失败");
  }
  return res.data.list ?? [];
}

export async function searchTasks(keyword: string, projectCode?: string, page = 1, pageSize = 30) {
  const res = await post<{ list: TaskItem[]; total: number }>("project/task/index", {
    keyword,
    projectCode,
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "搜索任务失败");
  return res.data;
}


export async function fetchTaskWorkTimes(taskCode: string) {
  const res = await post<{ list: TaskWorkTimeItem[] } | TaskWorkTimeItem[]>(
    "project/task/_taskWorkTimeList",
    { taskCode },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取工时失败");
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data.list ?? [];
}

export async function saveTaskWorkTime(
  taskCode: string,
  num: number,
  content: string,
  beginTime: string,
) {
  const res = await post("project/task/saveTaskWorkTime", {
    taskCode,
    num,
    content,
    beginTime,
  });
  if (!isOk(res)) throw new Error(res.msg || "登记工时失败");
}

export async function editTask(taskCode: string, name: string, description = "") {
  const res = await post("project/task/edit", { taskCode, name, description });
  if (!isOk(res)) throw new Error(res.msg || "更新任务失败");
}

export async function fetchMyTasks(page = 1, pageSize = 20) {
  const res = await post<{ list: TaskItem[]; total: number }>("project/task/selfList", {
    page,
    pageSize,
    type: 0,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取我的任务失败");
  return res.data;
}
