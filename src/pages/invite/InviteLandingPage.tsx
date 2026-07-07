import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Spinner } from "@heroui/react";

import * as inviteApi from "@/api/invite";
import { useAuthStore } from "@/stores/auth";

export default function InviteLandingPage() {
  const { code: inviteCode = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const logged = useAuthStore((s) => s.logged);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof inviteApi.fetchInviteLinkDetail>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const isOrgInvite = detail?.invite_type === "organization";

  useEffect(() => {
    if (!inviteCode) return;
    inviteApi
      .fetchInviteLinkDetail(inviteCode)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "邀请无效"))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  async function handleJoin() {
    if (!logged) {
      navigate("/member/login", { state: { from: { pathname: `/invite/${inviteCode}` } } });
      return;
    }
    setJoining(true);
    setError(null);
    try {
      if (isOrgInvite) {
        const data = await inviteApi.joinOrganizationByInviteLink(inviteCode);
        if (data.organizationList) {
          useAuthStore.setState({ organizationList: data.organizationList as never[] });
        }
        setJoined(true);
        navigate("/team/members");
      } else {
        await inviteApi.joinProjectByInviteLink(inviteCode);
        setJoined(true);
        const projectCode = detail?.source_code ?? detail?.sourceDetail?.code;
        if (projectCode) {
          navigate(`/project/${projectCode}/tasks`);
        } else {
          navigate("/projects");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加入失败");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 space-y-4">
        <h1 className="type-heading-medium">{isOrgInvite ? "组织邀请" : "项目邀请"}</h1>
        {error && !detail ? (
          <p className="text-danger text-sm">{error}</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="text-muted">{isOrgInvite ? "组织" : "项目"}：</span>
              {detail?.name ?? detail?.sourceDetail?.name ?? "—"}
            </p>
            {detail?.member?.name ? (
              <p className="text-sm">
                <span className="text-muted">邀请人：</span>
                {detail.member.name}
              </p>
            ) : null}
            {detail?.over_time ? (
              <p className="text-xs text-muted">链接有效期至 {detail.over_time}</p>
            ) : null}
            {error ? <p className="text-danger text-sm">{error}</p> : null}
            {joined ? (
              <p className="text-sm text-accent">
                {isOrgInvite ? "已成功加入组织" : "已成功加入项目"}
              </p>
            ) : (
              <Button className="w-full" isPending={joining} onPress={handleJoin}>
                {logged ? (isOrgInvite ? "加入组织" : "加入项目") : "登录并加入"}
              </Button>
            )}
            <Link className="block text-center text-sm text-muted hover:underline" to="/member/login">
              返回登录
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
