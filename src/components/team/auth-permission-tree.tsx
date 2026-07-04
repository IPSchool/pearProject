import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Spinner } from "@heroui/react";

import * as roleApi from "@/api/role";
import type { AuthNode } from "@/types/api";

interface AuthPermissionTreeProps {
  roleId: string;
}

function collectLeafKeys(nodes: AuthNode[]): string[] {
  const keys: string[] = [];
  for (const n of nodes) {
    if (n.children?.length) {
      keys.push(...collectLeafKeys(n.children));
    } else {
      keys.push(n.key ?? n.node);
    }
  }
  return keys;
}

function NodeRow({
  node,
  depth,
  checked,
  onToggle,
}: {
  node: AuthNode;
  depth: number;
  checked: Set<string>;
  onToggle: (key: string, on: boolean) => void;
}) {
  const key = node.key ?? node.node;
  const hasChildren = Boolean(node.children?.length);

  if (hasChildren) {
    return (
      <div>
        <p
          className="text-sm font-medium text-muted py-1"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {node.title}
        </p>
        {node.children!.map((c) => (
          <NodeRow
            key={c.key ?? c.node}
            checked={checked}
            depth={depth + 1}
            node={c}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  }

  return (
    <label
      className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-default-50 rounded"
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <Checkbox
        isSelected={checked.has(key)}
        onChange={(v) => onToggle(key, v)}
      />
      <span>{node.title}</span>
    </label>
  );
}

export function AuthPermissionTree({ roleId }: AuthPermissionTreeProps) {
  const [nodes, setNodes] = useState<AuthNode[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleApi.fetchRoleNodes(roleId);
      setNodes(data.list ?? []);
      setChecked(new Set(data.checkedList ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(key: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
    setSaved(false);
  }

  function selectAll() {
    setChecked(new Set(collectLeafKeys(nodes)));
    setSaved(false);
  }

  function clearAll() {
    setChecked(new Set());
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await roleApi.saveRoleNodes(roleId, [...checked]);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-success">权限已保存</p> : null}
      <div className="flex gap-2">
        <Button size="sm" variant="tertiary" onPress={selectAll}>全选</Button>
        <Button size="sm" variant="tertiary" onPress={clearAll}>清空</Button>
        <Button isPending={saving} size="sm" onPress={save}>保存权限</Button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto border border-separator rounded-lg p-3">
        {nodes.map((n) => (
          <NodeRow
            key={n.key ?? n.node}
            checked={checked}
            depth={0}
            node={n}
            onToggle={toggle}
          />
        ))}
        {!nodes.length ? <p className="text-muted text-sm">暂无权限节点</p> : null}
      </div>
    </div>
  );
}
