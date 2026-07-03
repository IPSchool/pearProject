import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function ProjectMembersPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ProjectMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  async function loadMembers() {
    const d = await memberApi.fetchProjectMembers(projectCode);
    setMembers(d.list ?? []);
  }

  useEffect(() => {
    loadMembers()
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [projectCode]);

  async function onSearch(value: string) {
    setKeyword(value);
    if (!value.trim()) {
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
    setInviting(true);
    setError(null);
    try {
      const link = await inviteApi.createProjectInviteLink(projectCode);
      setInviteCode(link.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成邀请链接失败");
    } finally {
      setInviting(false);
    }
  }

  async function handleInvite(memberCode: string) {
    setActing(memberCode);
    try {
      await memberApi.inviteMember(projectCode, memberCode);
      await loadMembers();
      setSearchResults((prev) => prev.filter((m) => m.code !== memberCode));
    } catch (e) {
      setError(e instanceof Error ? e.message : "邀请失败");
    } finally {
      setActing(null);
    }
  }

  async function handleRemove(memberCode: string) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">项目成员</h2>
        <Button isPending={inviting} size="sm" onPress={handleCreateInvite}>
          生成邀请链接
        </Button>
      </div>
      {inviteCode ? (
        <Card className="p-4 bg-accent/5">
          <p className="text-sm font-medium">邀请码</p>
          <p className="font-mono text-sm mt-1 break-all">{inviteCode}</p>
          <p className="text-xs text-muted mt-2">
            落地页：{" "}
            <a className="text-accent hover:underline" href={`/invite/${inviteCode}`}>
              /invite/{inviteCode}
            </a>
          </p>
        </Card>
      ) : null}
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
