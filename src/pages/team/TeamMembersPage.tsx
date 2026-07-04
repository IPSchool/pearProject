import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Chip, InputGroup, Spinner } from "@heroui/react";

import { MemberAvatar } from "@/components/member-avatar";
import { DepartmentFormModal } from "@/components/team/department-form-modal";
import {
  DepartmentTree,
  useDepartmentTreeRefresh,
} from "@/components/team/department-tree";
import type { DeptTreeNode } from "@/components/team/department-tree";
import { InviteMemberModal } from "@/components/team/invite-member-modal";
import * as accountApi from "@/api/account";
import * as deptApi from "@/api/department";
import * as dmApi from "@/api/departmentMember";
import type { AccountItem } from "@/types/api";

const MEMBER_FILTERS = [
  { key: 0, title: "所有成员" },
  { key: 1, title: "新加入的成员" },
  { key: 2, title: "未分配部门" },
  { key: 3, title: "停用的成员" },
] as const;

export default function TeamMembersPage() {
  const { refreshKey, refresh } = useDepartmentTreeRefresh();
  const [filterKey, setFilterKey] = useState(0);
  const [departmentCode, setDepartmentCode] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<DeptTreeNode | null>(null);
  const [keyword, setKeyword] = useState("");
  const [members, setMembers] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [deptModal, setDeptModal] = useState<
    "create" | "createChild" | "edit" | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMembers = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(!append);
      setError(null);
      try {
        const searchType = departmentCode ? 4 : filterKey;
        const data = await accountApi.fetchAccounts({
          page: pageNum,
          pageSize: 20,
          searchType,
          departmentCode: departmentCode ?? undefined,
          keyword: keyword.length >= 2 ? keyword : undefined,
        });
        const list = data.list ?? [];
        setMembers(append ? (prev) => [...prev, ...list] : list);
        setTotal(data.total ?? list.length);
        setPage(pageNum);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [filterKey, departmentCode, keyword],
  );

  useEffect(() => {
    loadMembers(1, false);
  }, [loadMembers]);

  function selectFilter(key: number) {
    setFilterKey(key);
    setDepartmentCode(null);
    setSelectedDept(null);
  }

  function selectDept(code: string | null, node: DeptTreeNode | null) {
    setDepartmentCode(code);
    setSelectedDept(node);
    if (code) setFilterKey(4);
  }

  async function deleteMember(item: AccountItem) {
    const scope = departmentCode ? "部门" : "组织";
    if (!confirm(`从${scope}内移除「${item.name}」？`)) return;
    try {
      if (departmentCode) {
        await dmApi.removeDepartmentMember(item.code, departmentCode);
      } else {
        await accountApi.deleteAccount(item.code);
      }
      await loadMembers(1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function toggleStatus(item: AccountItem) {
    try {
      if (item.status === 0) {
        await accountApi.resumeAccount(item.code);
      } else {
        await accountApi.forbidAccount(item.code);
      }
      await loadMembers(page, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function deleteDept() {
    if (!departmentCode) return;
    if (!confirm("删除部门将同时删除子部门，成员不会移出组织。确定继续？")) return;
    try {
      await deptApi.deleteDepartment(departmentCode);
      setDepartmentCode(null);
      setSelectedDept(null);
      refresh();
      await loadMembers(1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function onUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("文件不能超过 2MB");
      return;
    }
    setUploading(true);
    try {
      await dmApi.uploadDepartmentMembers(file);
      await loadMembers(1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setUploading(false);
    }
  }

  const title =
    departmentCode && selectedDept
      ? selectedDept.name
      : MEMBER_FILTERS.find((f) => f.key === filterKey)?.title ?? "成员";

  return (
    <div className="flex gap-6 min-h-[480px]">
      <aside className="w-56 shrink-0 space-y-4">
        <InputGroup>
          <InputGroup.Input
            placeholder="搜索成员"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </InputGroup>
        <div>
          <p className="text-xs text-muted mb-2 px-1">成员</p>
          <ul className="space-y-0.5">
            {MEMBER_FILTERS.map((f) => (
              <li key={f.key}>
                <button
                  className={`w-full text-left rounded-lg px-3 py-1.5 text-sm hover:bg-default-100 ${
                    !departmentCode && filterKey === f.key
                      ? "bg-accent/15 text-accent font-medium"
                      : ""
                  }`}
                  type="button"
                  onClick={() => selectFilter(f.key)}
                >
                  {f.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs text-muted">部门</p>
            <Button size="sm" variant="tertiary" onPress={() => setDeptModal("create")}>
              + 创建
            </Button>
          </div>
          <DepartmentTree
            refreshKey={refreshKey}
            selectedCode={departmentCode}
            onSelect={selectDept}
          />
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">
            {title} · {total}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onPress={() => setInviteOpen(true)}>添加成员</Button>
            <a
              className="inline-flex items-center text-sm text-accent hover:underline px-2"
              href={dmApi.departmentMemberTemplateUrl()}
              rel="noreferrer"
              target="_blank"
            >
              下载导入模板
            </a>
            <Button
              isPending={uploading}
              size="sm"
              variant="secondary"
              onPress={() => fileRef.current?.click()}
            >
              批量导入
            </Button>
            <input
              ref={fileRef}
              accept=".xlsx,.xls"
              className="hidden"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            {departmentCode ? (
              <>
                <Button size="sm" variant="tertiary" onPress={() => setDeptModal("createChild")}>
                  创建子部门
                </Button>
                <Button size="sm" variant="tertiary" onPress={() => setDeptModal("edit")}>
                  编辑部门
                </Button>
                <Button size="sm" variant="tertiary" onPress={deleteDept}>
                  删除部门
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-danger text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <Card key={m.code} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar name={m.name} src={m.avatar} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          className="font-medium hover:text-accent truncate"
                          to={`/team/members/${m.code}`}
                        >
                          {m.name}
                        </Link>
                        {m.is_owner ? <Chip size="sm" variant="soft">拥有者</Chip> : null}
                        {m.status === 0 ? (
                          <Chip color="warning" size="sm" variant="soft">已停用</Chip>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted truncate">
                        {m.email}
                        {m.departments ? ` · ${m.departments}` : ""}
                      </p>
                    </div>
                  </div>
                  {!m.is_owner ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="tertiary" onPress={() => toggleStatus(m)}>
                        {m.status === 0 ? "启用" : "停用"}
                      </Button>
                      <Button size="sm" variant="tertiary" onPress={() => deleteMember(m)}>
                        移除
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
            {!members.length ? (
              <Card className="p-8 text-center text-muted">暂无成员</Card>
            ) : null}
          </ul>
        )}

        {members.length < total ? (
          <div className="text-center">
            <Button variant="secondary" onPress={() => loadMembers(page + 1, true)}>
              加载更多
            </Button>
          </div>
        ) : null}
      </div>

      <InviteMemberModal
        departmentCode={departmentCode ?? ""}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => loadMembers(1, false)}
      />

      <DepartmentFormModal
        departmentCode={deptModal === "edit" ? departmentCode ?? undefined : undefined}
        initialName={deptModal === "edit" ? selectedDept?.name : ""}
        open={deptModal === "edit" || deptModal === "create" || deptModal === "createChild"}
        parentDepartmentCode={
          deptModal === "createChild" ? departmentCode ?? "" : ""
        }
        parentName={deptModal === "createChild" ? selectedDept?.name : undefined}
        onClose={() => setDeptModal(null)}
        onSaved={() => {
          refresh();
          setDeptModal(null);
        }}
      />
    </div>
  );
}
