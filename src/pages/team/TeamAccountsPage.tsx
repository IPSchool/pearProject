import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  Modal,
  Radio,
  RadioGroup,
  Spinner,
  TextField,
} from "@heroui/react";

import { MemberAvatar } from "@/components/member-avatar";
import * as accountApi from "@/api/account";
import type { AccountItem, AuthRole } from "@/types/api";

export default function TeamAccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [authList, setAuthList] = useState<AuthRole[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AccountItem | null>(null);
  const [authItem, setAuthItem] = useState<AccountItem | null>(null);
  const [selectedAuth, setSelectedAuth] = useState("");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountApi.fetchAccounts({ page: 1, pageSize: 50 });
      setAccounts(data.list ?? []);
      setAuthList(data.authList ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setName("");
    setMobile("");
    setEmail("");
    setAccount("");
    setPassword("");
    setDesc("");
    setFormOpen(true);
  }

  function openEdit(item: AccountItem) {
    setEditItem(item);
    setName(item.name ?? "");
    setMobile(item.mobile ?? "");
    setEmail(item.email ?? "");
    setDesc(item.description ?? "");
    setFormOpen(true);
  }

  async function saveForm() {
    setSaving(true);
    setError(null);
    try {
      if (editItem) {
        await accountApi.editAccount({
          code: editItem.code,
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          description: desc.trim(),
        });
      } else {
        await accountApi.addAccount({
          account: account.trim(),
          name: name.trim(),
          mobile: mobile.trim(),
          mail: email.trim(),
          desc: desc.trim(),
          password: password || undefined,
        });
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveAuth() {
    if (!authItem) return;
    setSaving(true);
    try {
      await accountApi.assignAccountRole(authItem.id ?? authItem.code, selectedAuth);
      setAuthItem(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "授权失败");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: AccountItem) {
    try {
      if (item.status === 0) await accountApi.resumeAccount(item.code);
      else await accountApi.forbidAccount(item.code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function remove(item: AccountItem) {
    if (!confirm(`删除账户「${item.name}」？`)) return;
    try {
      await accountApi.deleteAccount(item.code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">共 {total} 个账户 · 管理后台登录账号与角色授权</p>
        <Button onPress={openCreate}>添加账户</Button>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-separator text-left text-muted">
              <th className="py-2 pr-4">成员</th>
              <th className="py-2 pr-4">手机</th>
              <th className="py-2 pr-4">状态</th>
              <th className="py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.code} className="border-b border-separator/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={a.name} src={a.avatar} />
                    <div>
                      <Link className="font-medium hover:text-accent" to={`/team/members/${a.code}`}>
                        {a.name}
                      </Link>
                      <p className="text-xs text-muted">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted">{a.mobile || "—"}</td>
                <td className="py-3 pr-4">
                  {a.status === 0 ? (
                    <Chip color="warning" size="sm" variant="soft">停用</Chip>
                  ) : (
                    <Chip size="sm" variant="soft">正常</Chip>
                  )}
                </td>
                <td className="py-3">
                  {!a.is_owner ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="tertiary" onPress={() => openEdit(a)}>编辑</Button>
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => {
                          setAuthItem(a);
                          setSelectedAuth(String(a.authorize ?? ""));
                        }}
                      >
                        授权
                      </Button>
                      <Button size="sm" variant="tertiary" onPress={() => toggleStatus(a)}>
                        {a.status === 0 ? "启用" : "停用"}
                      </Button>
                      <Button size="sm" variant="tertiary" onPress={() => remove(a)}>删除</Button>
                    </div>
                  ) : (
                    <Chip size="sm" variant="soft">拥有者</Chip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length ? <Card className="p-8 text-center text-muted mt-4">暂无账户</Card> : null}
      </div>

      <Modal.Backdrop isOpen={formOpen} onOpenChange={setFormOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{editItem ? "编辑账户" : "添加账户"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {!editItem ? (
                <>
                  <TextField isRequired name="account">
                    <Label>登录账号</Label>
                    <InputGroup>
                      <InputGroup.Input value={account} onChange={(e) => setAccount(e.target.value)} />
                    </InputGroup>
                  </TextField>
                  <TextField name="password">
                    <Label>初始密码</Label>
                    <InputGroup>
                      <InputGroup.Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </InputGroup>
                  </TextField>
                </>
              ) : null}
              <TextField isRequired name="accName">
                <Label>姓名</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="mobile">
                <Label>手机</Label>
                <InputGroup>
                  <InputGroup.Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="email">
                <Label>邮箱</Label>
                <InputGroup>
                  <InputGroup.Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="desc">
                <Label>备注</Label>
                <InputGroup>
                  <InputGroup.Input value={desc} onChange={(e) => setDesc(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setFormOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={saveForm}>保存</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={Boolean(authItem)} onOpenChange={(v) => !v && setAuthItem(null)}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>访问授权 · {authItem?.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <RadioGroup
                value={selectedAuth}
                onChange={setSelectedAuth}
              >
                <Radio value="">无角色</Radio>
                {authList.map((r) => (
                  <Radio key={r.id} value={String(r.id)}>{r.title}</Radio>
                ))}
              </RadioGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setAuthItem(null)}>取消</Button>
              <Button isPending={saving} onPress={saveAuth}>保存</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
