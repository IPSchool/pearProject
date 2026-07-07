import type { TaskItem } from "@/types/api";
import type { ResolutionCode } from "@/lib/task-resolution";
import { isResolved } from "@/lib/task-resolution";

export type AssigneeFilter = "all" | "assigned" | "unassigned";
export type StartedFilter = "all" | "started" | "not_started";
export type PriorityFilter = "all" | "0" | "1" | "2";
export type DueFilter = "all" | "overdue" | "today" | "soon" | "none" | "set";
export type ListSortKey = "default" | "priority_desc" | "due_asc";

export type ResolutionFilter = "all" | "unresolved" | "resolved" | ResolutionCode;

export type TaskListFilters = {
  assignee: AssigneeFilter;
  started: StartedFilter;
  priority: PriorityFilter;
  due: DueFilter;
  resolution: ResolutionFilter;
  sort: ListSortKey;
};

export const DEFAULT_TASK_LIST_FILTERS: TaskListFilters = {
  assignee: "all",
  started: "all",
  priority: "all",
  due: "all",
  resolution: "all",
  sort: "default",
};

export type DueState = "none" | "overdue" | "today" | "soon" | "later";

export function parseTaskDay(value?: string): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value.replace(/-/g, "/"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isTaskAssigned(task: TaskItem) {
  return Boolean(task.assign_to?.trim() || task.executor?.code);
}

/** 已开始：非「未开始」状态、有开始时间或已完成 */
export function isTaskStarted(task: TaskItem) {
  if (task.done) return true;
  if (task.begin_time?.trim()) return true;
  const status = task.status ?? 0;
  return status !== 0;
}

export function getDueState(task: TaskItem, now = new Date()): DueState {
  const due = parseTaskDay(task.end_time);
  if (!due) return "none";
  const today = startOfDay(now).getTime();
  const dueDay = startOfDay(due).getTime();
  if (dueDay < today) return "overdue";
  if (dueDay === today) return "today";
  const soonLimit = today + 3 * 24 * 60 * 60 * 1000;
  if (dueDay <= soonLimit) return "soon";
  return "later";
}

export function countActiveFilters(filters: TaskListFilters) {
  let n = 0;
  if (filters.assignee !== "all") n++;
  if (filters.started !== "all") n++;
  if (filters.priority !== "all") n++;
  if (filters.due !== "all") n++;
  if (filters.resolution !== "all") n++;
  if (filters.sort !== "default") n++;
  return n;
}

export function applyTaskListFilters(tasks: TaskItem[], filters: TaskListFilters, now = new Date()) {
  return tasks.filter((task) => {
    if (filters.assignee === "assigned" && !isTaskAssigned(task)) return false;
    if (filters.assignee === "unassigned" && isTaskAssigned(task)) return false;

    if (filters.started === "started" && !isTaskStarted(task)) return false;
    if (filters.started === "not_started" && isTaskStarted(task)) return false;

    if (filters.priority !== "all" && String(task.pri ?? 0) !== filters.priority) return false;

    const dueState = getDueState(task, now);
    switch (filters.due) {
      case "overdue":
        if (dueState !== "overdue") return false;
        break;
      case "today":
        if (dueState !== "today") return false;
        break;
      case "soon":
        if (dueState !== "soon" && dueState !== "today") return false;
        break;
      case "none":
        if (dueState !== "none") return false;
        break;
      case "set":
        if (dueState === "none") return false;
        break;
      default:
        break;
    }

    const taskResolution = task.resolution ?? "";
    switch (filters.resolution) {
      case "unresolved":
        if (isResolved(taskResolution)) return false;
        break;
      case "resolved":
        if (!isResolved(taskResolution)) return false;
        break;
      case "all":
        break;
      default:
        if (taskResolution !== filters.resolution) return false;
        break;
    }

    return true;
  });
}

export function sortTaskList(tasks: TaskItem[], sort: ListSortKey) {
  const list = [...tasks];
  if (sort === "priority_desc") {
    list.sort((a, b) => (b.pri ?? 0) - (a.pri ?? 0));
    return list;
  }
  if (sort === "due_asc") {
    list.sort((a, b) => {
      const da = parseTaskDay(a.end_time);
      const db = parseTaskDay(b.end_time);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
    return list;
  }
  return list;
}
