import { http, isOk, post } from "@/api/client";
import type { AccountItem, InviteSearchMember } from "@/types/api";
import { apiBaseUrl } from "@/config/env";

export async function fetchDepartmentMembers(departmentCode: string, page = 1, pageSize = 50) {
  const res = await post<{ list: AccountItem[]; total: number }>(
    "project/departmentMember/index",
    { departmentCode, page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取部门成员失败");
  return res.data;
}

export async function searchInviteMember(keyword: string, departmentCode = "") {
  const res = await post<InviteSearchMember[]>(
    "project/departmentMember/searchInviteMember",
    { keyword, departmentCode },
  );
  if (!isOk(res)) throw new Error(res.msg || "搜索失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function inviteDepartmentMember(accountCode: string, departmentCode = "") {
  const res = await post("project/departmentMember/inviteMember", {
    accountCode,
    departmentCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "邀请失败");
}

export async function removeDepartmentMember(accountCode: string, departmentCode: string) {
  const res = await post("project/departmentMember/removeMember", {
    accountCode,
    departmentCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "移除失败");
}

export function departmentMemberTemplateUrl() {
  const base = apiBaseUrl();
  return base
    ? `${base}/project/departmentMember/_downloadTemplate`
    : "/api/project/departmentMember/_downloadTemplate";
}

export async function uploadDepartmentMembers(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await http.post("project/departmentMember/uploadFile", form);
  const body = response.data;
  body.code = Number(body.code);
  if (!isOk(body)) throw new Error(body.msg || "导入失败");
  return body.data;
}
