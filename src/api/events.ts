import { isOk, post } from "@/api/client";

export interface EventItem {
  code: string;
  title: string;
  description?: string;
  project_code?: string;
  projectName?: string;
  begin_time?: string;
  end_time?: string;
  position?: string;
  all_day?: number;
  waitConfirm?: number;
  memberList?: unknown[];
}

export interface EventListResult {
  list: EventItem[];
  total: number;
}

async function fetchEventList(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<EventListResult> {
  const res = await post<EventListResult>(path, { page: 1, pageSize: 20, ...params });
  if (!isOk(res)) throw new Error(res.msg || "获取日程失败");
  return { list: res.data?.list ?? [], total: res.data?.total ?? 0 };
}

export function fetchEvents(projectCode?: string) {
  return fetchEventList("project/events/index", projectCode ? { projectCode } : {});
}

export function fetchMyEvents(projectCode?: string) {
  return fetchEventList("project/events/myList", projectCode ? { projectCode } : {});
}

export function fetchConfirmEvents(projectCode?: string) {
  return fetchEventList("project/events/confirmList", projectCode ? { projectCode } : {});
}

export async function createEvent(input: {
  projectCode: string;
  title: string;
  description?: string;
  beginTime: string;
  endTime: string;
  position?: string;
}) {
  const res = await post<{ code: string }>("project/events/save", {
    project_code: input.projectCode,
    title: input.title,
    description: input.description ?? "",
    begin_time: input.beginTime,
    end_time: input.endTime,
    position: input.position ?? "",
    all_day: 0,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建日程失败");
  return res.data;
}

export async function fetchEvent(eventsCode: string) {
  const res = await post<EventItem>("project/events/read", { eventsCode });
  if (!isOk(res)) throw new Error(res.msg || "获取日程详情失败");
  return res.data;
}

export async function confirmEvent(eventsCode: string, status = 1) {
  const res = await post("project/events/confirmJoin", { eventsCode, status });
  if (!isOk(res)) throw new Error(res.msg || "确认日程失败");
}

export async function fetchCalendarEvents(date: string, memberCodes: string[]) {
  const res = await post<EventListResult>("project/events/getEventsListByCalendar", {
    date,
    memberCodes: JSON.stringify(memberCodes),
    pageSize: 50,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取日历日程失败");
  return res.data?.list ?? [];
}
