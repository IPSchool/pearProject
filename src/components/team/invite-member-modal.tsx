import { useEffect, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import * as dmApi from "@/api/departmentMember";
import * as inviteApi from "@/api/invite";
import type { InviteSearchMember } from "@/types/api";
import { MemberAvatar } from "@/components/member-avatar";
import { useAuthStore } from "@/stores/auth";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
  departmentCode?: string;
}

export function InviteMemberModal({
  open,
  onClose,
  onInvited,
  departmentCode = "",
}: InviteMemberModalProps) {
  const orgCode = useAuthStore((s) => s.currentOrganization?.code ?? "");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<InviteSearchMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setResults([]);
      setInviteLink(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!keyword || keyword.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await dmApi.searchInviteMember(keyword, departmentCode));
      } catch (e) {
        setError(e instanceof Error ? e.message : "搜索失败");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [keyword, departmentCode]);

  async function invite(accountCode: string) {
    setInviting(accountCode);
    setError(null);
    try {
      await dmApi.inviteDepartmentMember(accountCode, departmentCode);
      onInvited();
      setResults((prev) =>
        prev.map((r) => (r.accountCode === accountCode ? { ...r, joined: true } : r)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "邀请失败");
    } finally {
      setInviting(null);
    }
  }

  async function genOrgLink() {
    if (!orgCode) return;
    try {
      const data = await inviteApi.createOrganizationInviteLink(orgCode);
      setInviteLink(`${window.location.origin}/invite/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成链接失败");
    }
  }

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{departmentCode ? "邀请部门成员" : "邀请组织成员"}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <TextField name="keyword">
              <Label>邮箱或姓名搜索</Label>
              <InputGroup>
                <InputGroup.Input
                  placeholder="至少 2 个字符"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </InputGroup>
            </TextField>
            {searching ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.accountCode} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-default-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <MemberAvatar name={r.name} src={r.avatar} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted truncate">{r.email}</p>
                      </div>
                    </div>
                    {r.joined ? (
                      <span className="text-xs text-muted">已加入</span>
                    ) : (
                      <Button
                        isPending={inviting === r.accountCode}
                        size="sm"
                        onPress={() => invite(r.accountCode)}
                      >
                        添加
                      </Button>
                    )}
                  </li>
                ))}
                {!results.length && keyword.length >= 2 ? (
                  <li className="text-sm text-muted text-center py-4">无匹配成员</li>
                ) : null}
              </ul>
            )}
            {!departmentCode ? (
              <div className="border-t border-separator pt-4 space-y-2">
                <p className="text-sm font-medium">通过链接邀请</p>
                <Button size="sm" variant="secondary" onPress={genOrgLink}>
                  生成组织邀请链接
                </Button>
                {inviteLink ? (
                  <p className="text-xs text-muted break-all">{inviteLink}</p>
                ) : null}
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>关闭</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
