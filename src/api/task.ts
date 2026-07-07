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

/** 在父任务下创建子任务（自动继承项目与看板列） */
export async function createSubtask(parentCode: string, name: string, assignTo = "") {
  const res = await post<{ code: string }>("project/task/save", {
    name: name.trim(),
    pcode: parentCode,
    ...(assignTo ? { assign_to: assignTo } : {}),
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "创建子任务失败");
  }
  return res.data;
}

export async function fetchChildTasks(parentCode: string, page = 1, pageSize = 100) {
  const res = await post<{ list: TaskItem[]; total: number }>("project/task/index", {
    pcode: parentCode,
    deleted: 0,
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取子任务失败");
  return res.data;
}

export async function fetchTaskByRef(projectRef: string, taskRef: string) {
  const res = await post<TaskItem>("project/task/readByRef", { projectRef, taskRef });
  if (!isOk(res)) {
    throw new Error(res.msg || "获取任务详情失败");
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

export async function fetchTaskByIssueKey(issueKey: string) {
  const res = await post<TaskItem>("project/task/readByIssueKey", { issueKey });
  if (!isOk(res)) {
    throw new Error(res.msg || "Issue 不存在");
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

export async function createComment(taskCode: string, comment: string, mentions = "[]") {
  const res = await post("project/task/createComment", { taskCode, comment, mentions });
  if (!isOk(res)) {
    throw new Error(res.msg || "评论失败");
  }
}

export async function deleteComment(logCode: string) {
  const res = await post("project/task/deleteComment", { logCode });
  if (!isOk(res)) {
    throw new Error(res.msg || "删除评论失败");
  }
}

export async function toggleCommentReaction(logCode: string, reaction = "like") {
  const res = await post<{ reactions: import("@/types/api").TaskLogReaction[] }>(
    "project/task/toggleCommentReaction",
    { logCode, reaction },
  );
  if (!isOk(res)) {
    throw new Error(res.msg || "操作失败");
  }
  return res.data?.reactions ?? [];
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

export async function fetchTaskActivity(taskCode: string) {
  const res = await post<{ list: TaskLogItem[]; total: number }>("project/task/taskLog", {
    taskCode,
    page: 1,
    pageSize: 50,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "获取动态失败");
  }
  return res.data.list ?? [];
}

export async function fetchProjectTasks(projectCode: string, page = 1, pageSize = 200) {
  const res = await post<{ list: TaskItem[]; total: number }>("project/task/index", {
    projectCode,
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取任务列表失败");
  return res.data;
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

export type TaskPatch = Partial<{
  name: string;
  description: string;
  pri: number;
  status: number;
  end_time: string;
  begin_time: string;
}>;

export async function patchTask(taskCode: string, fields: TaskPatch) {
  const res = await post("project/task/edit", { taskCode, ...fields });
  if (!isOk(res)) throw new Error(res.msg || "更新任务失败");
}

export async function assignTask(taskCode: string, executorCode: string) {
  const res = await post("project/task/assignTask", { taskCode, executorCode });
  if (!isOk(res)) throw new Error(res.msg || "指派任务失败");
}

/** 设置或清除父项；parentCode 为空字符串表示变为顶层任务 */
export async function setTaskParent(taskCode: string, parentCode: string) {
  const res = await post("project/task/setParent", { taskCode, parentCode });
  if (!isOk(res)) throw new Error(res.msg || "设置父项失败");
}

export async function scheduleTaskDueDate(taskCode: string, date: string) {
  await patchTask(taskCode, { end_time: `${date} 18:00:00` });
}

export async function clearTaskSchedule(taskCode: string) {
  await patchTask(taskCode, { end_time: "", begin_time: "" });
}

export type MyTasksFilter = 0 | -1;
export type MyTasksType = 1 | 2 | 3;

export async function fetchMyTasks(
  page = 1,
  pageSize = 20,
  taskType: MyTasksType = 1,
  doneFilter: MyTasksFilter = 0,
) {
  const res = await post<{ list: TaskItem[]; total: number }>("project/task/selfList", {
    page,
    pageSize,
    type: doneFilter,
    taskType,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取我的任务失败");
  return res.data;
}

/** 列表展示用标题：空标题时回退到编号 */
export function taskDisplayTitle(
  task: Pick<TaskItem, "name" | "code" | "id_num" | "issueKey">,
) {
  const title = task.name?.trim();
  if (title) return title;
  const key = task.issueKey || (task.id_num != null ? String(task.id_num) : "");
  return key ? `（无标题 · ${key}）` : task.code ? `（无标题 · ${task.code.slice(0, 8)}）` : "（无标题）";
}
