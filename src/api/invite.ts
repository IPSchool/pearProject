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
  const res = await post<
    InviteLinkResult & {
      name?: string;
      sourceDetail?: { name?: string; code?: string };
      member?: { name?: string };
    }
  >("project/inviteLink/_read", {
    inviteCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "读取邀请链接失败");
  return res.data;
}

export async function joinProjectByInviteLink(inviteCode: string) {
  const res = await post<{ organizationList?: unknown[]; currentOrganization?: unknown }>(
    "project/projectMember/_joinByInviteLink",
    { inviteCode },
  );
  if (!isOk(res)) throw new Error(res.msg || "加入项目失败");
  return res.data;
}
