import { isOk, post } from "@/api/client";

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: number;
  create_time: string;
}

export interface NoReadsSummary {
  total: number;
  totalSum?: { notice: number; message: number; task: number };
}

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
