import { isOk, post } from "@/api/client";
import type { NotificationItem, NoReadsSummary } from "@/types/api";

export type { NotificationItem, NoReadsSummary };

export async function fetchNotifications(page = 1, pageSize = 20) {
  const res = await post<{ list: NotificationItem[]; total: number }>("project/notify/index", {
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取通知失败");
  return res.data;
}

export async function fetchNoReads() {
  const res = await post<NoReadsSummary>("project/notify/noReads", {});
  if (!isOk(res)) throw new Error(res.msg || "获取未读失败");
  return res.data;
}

export async function markNotificationRead(notifyId: number) {
  const res = await post("project/notify/setReadied", { notifyId });
  if (!isOk(res)) throw new Error(res.msg || "标记已读失败");
}

export async function deleteNotification(notifyId: number) {
  const res = await post("project/notify/delete", { notifyId });
  if (!isOk(res)) throw new Error(res.msg || "删除失败");
}

export async function clearAllNotifications() {
  const res = await post("project/notify/_clearAll", {});
  if (!isOk(res)) throw new Error(res.msg || "清空失败");
}
