import { useCallback, useEffect, useState } from "react";
import { Button, Card, Chip, Spinner } from "@heroui/react";

import { OrgEditModal } from "@/components/team/org-edit-modal";
import * as orgApi from "@/api/organization";
import { useAuthStore } from "@/stores/auth";
import type { OrganizationItem } from "@/types/api";

export default function TeamOrganizationsPage() {
  const member = useAuthStore((s) => s.member);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState<OrganizationItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await orgApi.fetchOrganizations(1, 50);
      setItems(d.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleQuit(org: OrganizationItem) {
    if (!confirm(`确定退出组织「${org.name}」？`)) return;
    setActionId(org.code);
    try {
      await orgApi.quitOrganization(org.code);
      const list = await orgApi.fetchOrgList();
      if (list[0]) await switchOrganization(list[0].code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "退出失败");
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate() {
    const name = prompt("新组织名称");
    if (!name?.trim()) return;
    setCreating(true);
    try {
      await orgApi.createOrganization(name.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button isPending={creating} onPress={handleCreate}>新建组织</Button>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((o) => {
          const isOwner = o.owner_code === member?.code;
          return (
            <Card key={o.code} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{o.name}</p>
                    {o.personal ? <Chip size="sm" variant="soft">个人</Chip> : null}
                    {isOwner ? <Chip color="accent" size="sm" variant="soft">拥有者</Chip> : null}
                  </div>
                  <p className="text-sm text-muted mt-1">{o.address || o.description || "—"}</p>
                  <p className="text-xs text-muted mt-2">{o.create_time}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {isOwner ? (
                    <Button size="sm" variant="tertiary" onPress={() => setEditOrg(o)}>
                      编辑
                    </Button>
                  ) : (
                    <Button
                      isPending={actionId === o.code}
                      size="sm"
                      variant="tertiary"
                      onPress={() => handleQuit(o)}
                    >
                      退出
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <OrgEditModal
        open={Boolean(editOrg)}
        org={editOrg}
        onClose={() => setEditOrg(null)}
        onSaved={load}
      />
    </div>
  );
}
