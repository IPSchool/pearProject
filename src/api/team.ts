import { isOk, post } from "@/api/client";

export interface OrganizationItem {
  code: string;
  name: string;
  description?: string;
  personal?: number;
  create_time?: string;
}

export interface DepartmentItem {
  code: string;
  name: string;
  organization_code?: string;
  pcode?: string;
}

export interface AuthRole {
  id: string;
  title: string;
  desc?: string;
  status?: number;
}

export async function fetchOrganizations(page = 1, pageSize = 20) {
  const res = await post<{ list: OrganizationItem[]; total: number }>(
    "project/organization/index",
    { page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取组织失败");
  return res.data;
}

export async function fetchDepartments(page = 1, pageSize = 20) {
  const res = await post<{ list: DepartmentItem[]; total: number }>(
    "project/department/index",
    { page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取部门失败");
  return res.data;
}

export async function fetchDepartment(departmentCode: string) {
  const res = await post<DepartmentItem>("project/department/read", { departmentCode });
  if (!isOk(res)) throw new Error(res.msg || "获取部门详情失败");
  return res.data;
}

export async function fetchAuthRoles(page = 1, pageSize = 20) {
  const res = await post<{ list: AuthRole[]; total: number }>("project/auth/index", {
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取角色失败");
  return res.data;
}

export async function fetchAccounts(page = 1, pageSize = 20) {
  const res = await post<{ list: unknown[]; total: number }>("project/account/index", {
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取账户失败");
  return res.data;
}

export async function fetchDepartmentMembers(page = 1, pageSize = 20) {
  const res = await post<{ list: unknown[]; total: number }>(
    "project/departmentMember/index",
    { page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取部门成员失败");
  return res.data;
}
