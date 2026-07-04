import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import * as roleApi from "@/api/role";
import type { AuthRole } from "@/types/api";

export default function TeamRolesPage() {
  const [items, setItems] = useState<AuthRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AuthRole | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleApi.fetchRoles(1, 50);
      setItems(data.list ?? []);
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
    setTitle("");
    setDesc("");
    setFormOpen(true);
  }

  function openEdit(r: AuthRole) {
    setEditItem(r);
    setTitle(r.title);
    setDesc(r.desc ?? "");
    setFormOpen(true);
  }

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await roleApi.editRole(editItem.id, title.trim(), desc.trim());
      } else {
        await roleApi.addRole(title.trim(), desc.trim());
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: AuthRole) {
    if (!confirm(`删除角色「${r.title}」？`)) return;
    try {
      await roleApi.deleteRole(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function toggleStatus(r: AuthRole) {
    try {
      if (r.status === 0) await roleApi.resumeRole(r.id);
      else await roleApi.forbidRole(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function setDefault(r: AuthRole) {
    try {
      await roleApi.setDefaultRole(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "设置失败");
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onPress={openCreate}>新建角色</Button>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{r.title}</p>
                  {r.is_default ? <Chip color="accent" size="sm" variant="soft">默认</Chip> : null}
                  <Chip size="sm" variant="soft">{r.status === 1 ? "启用" : "停用"}</Chip>
                </div>
                <p className="text-sm text-muted mt-1">{r.desc || "—"}</p>
                {r.create_at ? <p className="text-xs text-muted mt-2">{r.create_at}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm bg-secondary text-secondary-foreground hover:opacity-90"
                to={`/team/roles/${r.id}/apply`}
              >
                节点授权
              </Link>
              <Button size="sm" variant="tertiary" onPress={() => openEdit(r)}>编辑</Button>
              {!r.is_default ? (
                <Button size="sm" variant="tertiary" onPress={() => setDefault(r)}>设为默认</Button>
              ) : null}
              <Button size="sm" variant="tertiary" onPress={() => toggleStatus(r)}>
                {r.status === 0 ? "启用" : "停用"}
              </Button>
              {r.canDelete !== false ? (
                <Button size="sm" variant="tertiary" onPress={() => remove(r)}>删除</Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Modal.Backdrop isOpen={formOpen} onOpenChange={setFormOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{editItem ? "编辑角色" : "新建角色"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="title">
                <Label>角色名称</Label>
                <InputGroup>
                  <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="desc">
                <Label>描述</Label>
                <InputGroup>
                  <InputGroup.Input value={desc} onChange={(e) => setDesc(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setFormOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={save}>保存</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
