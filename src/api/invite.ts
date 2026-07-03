import { isOk, post } from "@/api/client";

export interface InviteLinkResult {
  code: string;
  invite_type?: string;
  source_code?: string;
  over_time?: string;
}

export async function createProjectInviteLink(projectCode: string) {
  const res = await post<InviteLinkResult>("project/inviteLink/save", {
    inviteType: "project",
    sourceCode: projectCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "生成邀请链接失败");
  return res.data;
}

export async function fetchInviteLinkDetail(inviteCode: string) {
  const res = await post<InviteLinkResult & { name?: string }>("project/inviteLink/_read", {
    inviteCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "读取邀请链接失败");
  return res.data;
}
