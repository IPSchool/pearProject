import { useCallback, useEffect, useState } from "react";

import * as taskApi from "@/api/task";
import * as taskTagApi from "@/api/taskTag";
import type { TaskItem, TaskLogItem, TaskTagItem, TaskWorkTimeItem } from "@/types/api";

export function useTaskDetail(taskCode: string | null, enabled = true) {
  const [task, setTask] = useState<TaskItem | null>(null);
  const [comments, setComments] = useState<TaskLogItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<TaskLogItem[]>([]);
  const [workTimes, setWorkTimes] = useState<TaskWorkTimeItem[]>([]);
  const [taskTags, setTaskTags] = useState<TaskTagItem[]>([]);
  const [projectTags, setProjectTags] = useState<TaskTagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (code: string) => {
    const [taskData, commentList, activityList, wtList, tagsOnTask] = await Promise.all([
      taskApi.fetchTask(code),
      taskApi.fetchTaskComments(code),
      taskApi.fetchTaskActivity(code),
      taskApi.fetchTaskWorkTimes(code),
      taskTagApi.fetchTaskTagsForTask(code),
    ]);
    setTask(taskData);
    setComments(commentList);
    setActivityLogs(activityList);
    setWorkTimes(wtList);
    setTaskTags(tagsOnTask);
    if (taskData.project_code) {
      const all = await taskTagApi.fetchTaskTags(taskData.project_code);
      setProjectTags(all);
    } else {
      setProjectTags([]);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !taskCode) {
      setTask(null);
      setComments([]);
      setActivityLogs([]);
      setWorkTimes([]);
      setTaskTags([]);
      setProjectTags([]);
      return;
    }
    setLoading(true);
    setError(null);
    loadAll(taskCode)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [enabled, taskCode, loadAll]);

  return {
    task,
    comments,
    activityLogs,
    workTimes,
    taskTags,
    projectTags,
    loading,
    error,
    setError,
    reload: () => (taskCode ? loadAll(taskCode) : Promise.resolve()),
  };
}
