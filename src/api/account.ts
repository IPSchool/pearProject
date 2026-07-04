import { isOk, post } from "@/api/client";
import type { AccountItem, AuthRole } from "@/types/api";

export interface AccountListResult {
  list: AccountItem[];
  total: number;
  authList?: AuthRole[];
}

export async function fetchAccounts(params: {
  page?: number;
  pageSize?: number;
  searchType?: number;
  departmentCode?: string;
  keyword?: string;
} = {}) {
  const { page = 1, pageSize = 20, searchType, departmentCode, keyword } = params;
  const res = await post<AccountListResult>("project/account/index", {
    page,
    pageSize,
    searchType,
    departmentCode,
    keyword,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取账户失败");
  return res.data;
}

export async function fetchAllAccounts(keyword = "") {
  const res = await post<AccountItem[]>("project/account/_allList", { keyword });
  if (!isOk(res)) throw new Error(res.msg || "获取账户失败");
  return Array.isArray(res.data) ? res.data : [];
}

export async function readAccount(code: string) {
  const res = await post<AccountItem>("project/account/read", { code });
  if (!isOk(res)) throw new Error(res.msg || "获取账户详情失败");
  return res.data;
}

export async function addAccount(data: {
  account: string;
  name: string;
  mobile?: string;
  mail?: string;
  desc?: string;
  password?: string;
}) {
  const res = await post<AccountItem>("project/account/add", data);
  if (!isOk(res)) throw new Error(res.msg || "添加账户失败");
  return res.data;
}

export async function editAccount(data: {
  code: string;
  name?: string;
  mobile?: string;
  email?: string;
  position?: string;
  description?: string;
}) {
  const res = await post("project/account/edit", data);
  if (!isOk(res)) throw new Error(res.msg || "更新账户失败");
}

export async function deleteAccount(accountCode: string) {
  const res = await post("project/account/del", { accountCode });
  if (!isOk(res)) throw new Error(res.msg || "删除账户失败");
}

export async function forbidAccount(accountCode: string) {
  const res = await post("project/account/forbid", { accountCode, status: 0 });
  if (!isOk(res)) throw new Error(res.msg || "停用账户失败");
}

export async function resumeAccount(accountCode: string) {
  const res = await post("project/account/resume", { accountCode, status: 1 });
  if (!isOk(res)) throw new Error(res.msg || "启用账户失败");
}

export async function assignAccountRole(id: string | number, auth: string | number) {
  const res = await post("project/account/auth", { id, auth });
  if (!isOk(res)) throw new Error(res.msg || "授权失败");
}

export async function syncAccountDetail(code: string) {
  const res = await post("project/account/_syncDetail", { code });
  if (!isOk(res)) throw new Error(res.msg || "同步失败");
}
