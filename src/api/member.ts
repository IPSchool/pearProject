import { isOk, post } from "@/api/client";

export interface ProjectMember {
  code: string;
  name: string;
  email?: string;
  avatar?: string;
  is_owner?: number;
}

export async function fetchProjectMembers(projectCode: string, page = 1, pageSize = 50) {
  const res = await post<{ list: ProjectMember[]; total: number }>(
    "project/projectMember/index",
    { projectCode, page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取成员失败");
  return res.data;
}

export async function searchInviteMember(projectCode: string, keyword: string) {
  const res = await post<{ list: ProjectMember[] }>("project/projectMember/searchInviteMember", {
    projectCode,
    keyword,
  });
  if (!isOk(res)) throw new Error(res.msg || "搜索失败");
  return res.data.list ?? [];
}
