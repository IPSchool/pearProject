import { isOk, post } from "@/api/client";
import type { ProjectMember } from "@/types/api";

export type { ProjectMember };

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

export async function listForInvite(projectCode: string) {
  const res = await post<ProjectMember[]>("project/projectMember/_listForInvite", {
    projectCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取可邀请列表失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function inviteMember(projectCode: string, memberCode: string) {
  const res = await post("project/projectMember/inviteMember", { projectCode, memberCode });
  if (!isOk(res)) throw new Error(res.msg || "邀请失败");
}

export async function removeMember(projectCode: string, memberCode: string) {
  const res = await post("project/projectMember/removeMember", { projectCode, memberCode });
  if (!isOk(res)) throw new Error(res.msg || "移除失败");
}
