import { isOk, post } from "@/api/client";
import type { LoginResult, Member, RegisterPayload } from "@/types/api";

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
  const res = await post<LoginResult["menuList"]>("project/index/index", {});
  if (!isOk(res)) {
    throw new Error(res.msg || "获取菜单失败");
  }
  return res.data ?? [];
}

export async function changeOrganization(organizationCode: string) {
  const res = await post<{ menuList: LoginResult["menuList"]; member: Member }>(
    "project/index/changeCurrentOrganization",
    { organizationCode },
  );
  if (!isOk(res)) {
    throw new Error(res.msg || "切换组织失败");
  }
  return res.data;
}

export async function editPersonal(data: {
  name?: string;
  realname?: string;
  description?: string;
  email?: string;
}) {
  const res = await post("project/index/editPersonal", data);
  if (!isOk(res)) {
    throw new Error(res.msg || "保存失败");
  }
}

export async function editPassword(data: {
  oldPassword: string;
  newPassword: string;
  newPassword2: string;
}) {
  const res = await post("project/index/editPassword", data);
  if (!isOk(res)) {
    throw new Error(res.msg || "修改密码失败");
  }
}

export async function requestRegister(payload: RegisterPayload) {
  const res = await post("project/login/register", { ...payload });
  if (!isOk(res)) {
    throw new Error(res.msg || "注册失败");
  }
  return res.data;
}

export async function requestCaptcha(mobile: string) {
  const res = await post("project/login/getCaptcha", { mobile });
  if (!isOk(res)) {
    throw new Error(res.msg || "发送验证码失败");
  }
}
