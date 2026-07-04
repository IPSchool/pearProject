import { isOk, post } from "@/api/client";
import type { AuthNode, AuthRole } from "@/types/api";

export async function fetchRoles(page = 1, pageSize = 50) {
  const res = await post<{ list: AuthRole[]; total: number }>("project/auth/index", {
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取角色失败");
  return res.data;
}

export async function addRole(title: string, desc = "") {
  const res = await post<AuthRole>("project/auth/add", { title, desc, status: 1, sort: 0 });
  if (!isOk(res)) throw new Error(res.msg || "创建角色失败");
  return res.data;
}

export async function editRole(id: string | number, title: string, desc = "") {
  const res = await post("project/auth/edit", { id, title, desc });
  if (!isOk(res)) throw new Error(res.msg || "更新角色失败");
}

export async function deleteRole(id: string | number) {
  const res = await post("project/auth/del", { id });
  if (!isOk(res)) throw new Error(res.msg || "删除角色失败");
}

export async function forbidRole(id: string | number) {
  const res = await post("project/auth/forbid", { id, status: 0 });
  if (!isOk(res)) throw new Error(res.msg || "禁用角色失败");
}

export async function resumeRole(id: string | number) {
  const res = await post("project/auth/resume", { id, status: 1 });
  if (!isOk(res)) throw new Error(res.msg || "启用角色失败");
}

export async function setDefaultRole(id: string | number) {
  const res = await post("project/auth/setDefault", { id, is_default: 1 });
  if (!isOk(res)) throw new Error(res.msg || "设置默认角色失败");
}

export async function fetchRoleNodes(id: string | number) {
  const res = await post<{ list: AuthNode[]; checkedList: string[] }>("project/auth/apply", {
    id,
    action: "getnode",
  });
  if (!isOk(res)) throw new Error(res.msg || "获取权限节点失败");
  return res.data;
}

export async function saveRoleNodes(id: string | number, nodes: string[]) {
  const res = await post("project/auth/apply", {
    id,
    action: "save",
    nodes: JSON.stringify(nodes),
  });
  if (!isOk(res)) throw new Error(res.msg || "保存权限失败");
}
