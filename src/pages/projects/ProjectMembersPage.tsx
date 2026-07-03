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
import type { ProjectMember } from "@/api/member";
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

  useEffect(() => {
    memberApi
      .fetchProjectMembers(projectCode)
      .then((d) => setMembers(d.list ?? []))
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
          <p className="text-xs text-muted mt-2">对接 `inviteLink/save`，有效期 24 小时</p>
        </Card>
      ) : null}
      {error ? <p className="text-danger text-sm">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Card key={m.code} className="p-4 flex items-center gap-3">
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
              <li key={m.code} className="flex items-center gap-2">
                <MemberAvatar className="shrink-0" name={m.name} src={m.avatar} />
                {m.name} — {m.email}
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
