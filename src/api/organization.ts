import { isOk, post } from "@/api/client";
import type { OrganizationItem } from "@/types/api";

export async function fetchOrganizations(page = 1, pageSize = 50) {
  const res = await post<{ list: OrganizationItem[]; total: number }>(
    "project/organization/index",
    { page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取组织失败");
  return res.data;
}

export async function fetchOrgList() {
  const res = await post<OrganizationItem[]>("project/organization/_getOrgList", {});
  if (!isOk(res)) throw new Error(res.msg || "获取组织列表失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function readOrganization(organizationCode: string) {
  const res = await post<OrganizationItem>("project/organization/read", { organizationCode });
  if (!isOk(res)) throw new Error(res.msg || "获取组织详情失败");
  return res.data;
}

export async function createOrganization(name: string, address = "") {
  const res = await post<OrganizationItem>("project/organization/save", { name, address });
  if (!isOk(res)) throw new Error(res.msg || "创建组织失败");
  return res.data;
}

export async function editOrganization(organizationCode: string, name: string, address = "") {
  const res = await post("project/organization/edit", { organizationCode, name, address });
  if (!isOk(res)) throw new Error(res.msg || "更新组织失败");
}

export async function quitOrganization(organizationCode: string) {
  const res = await post("project/organization/_quitOrganization", { organizationCode });
  if (!isOk(res)) throw new Error(res.msg || "退出组织失败");
}
