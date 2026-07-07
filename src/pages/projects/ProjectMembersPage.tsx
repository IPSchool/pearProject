import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Spinner,
  TextField,
} from "@heroui/react";

import * as inviteApi from "@/api/invite";
import * as memberApi from "@/api/member";
import type { ProjectMember } from "@/types/api";
import { MemberAvatar } from "@/components/member-avatar";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";

function buildInviteUrl(inviteCode: string) {
  if (typeof window === "undefined") return `/invite/${inviteCode}`;
  return `${window.location.origin}/invite/${inviteCode}`;
}

export default function ProjectMembersPage() {
  const { apiCode, projectRef } = useProjectRoute();
  const projectCode = apiCode || projectRef;
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ProjectMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const inviteUrl = useMemo(
    () => (inviteCode ? buildInviteUrl(inviteCode) : ""),
    [inviteCode],
  );

  const loadMembers = useCallback(async () => {
    if (!projectCode) return;
    const d = await memberApi.fetchProjectMembers(projectCode);
    setMembers(d.list ?? []);
  }, [projectCode]);

  useEffect(() => {
    if (!projectCode) return;
    setLoading(true);
    loadMembers()
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [projectCode, loadMembers]);

  async function onSearch(value: string) {
    setKeyword(value);
    if (!value.trim() || !projectCode) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const list = await memberApi.searchInviteMember(projectCode, value.trim());
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleCreateInvite() {
    if (!projectCode) return;
    setInviting(true);
    setError(null);
    setMessage(null);
    try {
      const link = await inviteApi.createProjectInviteLink(projectCode);
      setInviteCode(link.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成邀请链接失败");
    } finally {
      setInviting(false);
    }
  }

  async function handleCopyInviteUrl() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("邀请链接已复制");
    } catch {
      setMessage("请手动复制下方链接");
    }
  }

  async function handleSendInviteEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!projectCode || !inviteEmail.trim()) return;
    setSendingEmail(true);
    setError(null);
    setMessage(null);
    try {
      const data = await memberApi.sendInviteEmail(projectCode, inviteEmail.trim());
      if (data.inviteUrl) {
        setInviteCode(data.inviteUrl.split("/invite/").pop() ?? null);
      }
      setMessage("邀请邮件已发送");
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送邀请邮件失败");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleInvite(memberCode: string) {
    if (!projectCode) return;
    setActing(memberCode);
    try {
      await memberApi.inviteMember(projectCode, memberCode);
      await loadMembers();
      setSearchResults((prev) => prev.filter((m) => m.code !== memberCode));
      setMessage("已邀请该成员");
    } catch (e) {
      setError(e instanceof Error ? e.message : "邀请失败");
    } finally {
      setActing(null);
    }
  }

  async function handleRemove(memberCode: string) {
    if (!projectCode) return;
    setActing(memberCode);
    try {
      await memberApi.removeMember(projectCode, memberCode);
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "移除失败");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button isPending={inviting} size="sm" onPress={handleCreateInvite}>
            生成邀请链接
          </Button>
        }
        size="medium"
        title="项目成员"
      />

      {inviteCode ? (
        <Card className="p-4 bg-accent/5 space-y-2">
          <p className="text-sm font-medium">邀请链接</p>
          <p className="font-mono text-sm break-all">{inviteUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onPress={handleCopyInviteUrl}>
              复制链接
            </Button>
            <a className="text-sm text-accent hover:underline self-center" href={inviteUrl}>
              打开落地页
            </a>
          </div>
          <p className="text-xs text-muted">链接 24 小时内有效，接受邀请需注册/登录账号。</p>
        </Card>
      ) : null}

      <Card className="p-4 space-y-3">
        <p className="font-medium">邮件邀请外部成员</p>
        <p className="text-sm text-muted">
          向未在组织内的邮箱发送邀请信（需管理员在系统设置中配置 SMTP）。
        </p>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSendInviteEmail}>
          <TextField className="flex-1" name="inviteEmail">
            <InputGroup>
              <InputGroup.Input
                placeholder="外部成员邮箱"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </InputGroup>
          </TextField>
          <Button isPending={sendingEmail} size="sm" type="submit">
            发送邀请邮件
          </Button>
        </form>
      </Card>

      {message ? <p className="text-success text-sm">{message}</p> : null}
      {error ? <p className="text-danger text-sm">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Card key={m.code} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <MemberAvatar name={m.name} src={m.avatar} />
              <div className="min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted truncate">{m.email}</p>
                {m.is_owner ? (
                  <Chip className="mt-1" size="sm" variant="soft">
                    拥有者
                  </Chip>
                ) : null}
              </div>
            </div>
            {!m.is_owner ? (
              <Button
                isPending={acting === m.code}
                size="sm"
                variant="tertiary"
                onPress={() => handleRemove(m.code)}
              >
                移除
              </Button>
            ) : null}
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <p className="font-medium">搜索可邀请成员</p>
        <TextField name="keyword">
          <InputGroup>
            <InputGroup.Input
              placeholder="输入姓名或邮箱..."
              value={keyword}
              onChange={(e) => onSearch(e.target.value)}
            />
          </InputGroup>
        </TextField>
        {searching ? <Spinner size="sm" /> : null}
        {searchResults.length ? (
          <ul className="text-sm space-y-2">
            {searchResults.map((m) => (
              <li key={m.code} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MemberAvatar className="shrink-0" name={m.name} src={m.avatar} />
                  {m.name} — {m.email}
                </div>
                <Button
                  isPending={acting === m.code}
                  size="sm"
                  onPress={() => handleInvite(m.code)}
                >
                  邀请
                </Button>
              </li>
            ))}
          </ul>
        ) : keyword ? (
          <p className="text-sm text-muted">无匹配结果</p>
        ) : null}
      </section>
    </div>
  );
}
