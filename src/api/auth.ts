import { isOk, post } from "@/api/client";
import type { LoginResult, Member } from "@/types/api";

export async function login(account: string, passwordMd5: string) {
  const res = await post<LoginResult>("project/login/index", {
    account,
    password: passwordMd5,
  });
  if (!isOk(res)) {
    throw new Error(res.msg || "登录失败");
  }
  return res.data;
}

export async function logout() {
  await post("project/login/_out", {});
}

export async function fetchCurrentMember() {
  const res = await post<Member>("project/login/_currentMember", {});
  if (!isOk(res)) {
    throw new Error(res.msg || "获取用户信息失败");
  }
  return res.data;
}

export async function fetchMenu() {
  const res = await post<{ menuList: LoginResult["menuList"] }>(
    "project/index/index",
    {},
  );
  if (!isOk(res)) {
    throw new Error(res.msg || "获取菜单失败");
  }
  return res.data.menuList;
}
