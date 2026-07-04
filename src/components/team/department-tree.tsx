import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import clsx from "clsx";

import * as deptApi from "@/api/department";
import type { DepartmentItem } from "@/types/api";

export interface DeptTreeNode extends DepartmentItem {
  children?: DeptTreeNode[];
  expanded?: boolean;
  loading?: boolean;
}

interface DepartmentTreeProps {
  selectedCode: string | null;
  onSelect: (code: string | null, node: DeptTreeNode | null) => void;
  refreshKey?: number;
}

export function DepartmentTree({ selectedCode, onSelect, refreshKey = 0 }: DepartmentTreeProps) {
  const [nodes, setNodes] = useState<DeptTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deptApi.fetchDepartments("", 1, 100);
      setNodes(
        (data.list ?? []).map((d) => ({
          ...d,
          expanded: false,
          children: d.hasNext ? [] : undefined,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoots();
  }, [loadRoots, refreshKey]);

  async function toggleExpand(node: DeptTreeNode) {
    if (!node.hasNext && !node.children?.length) return;
    if (node.expanded) {
      setNodes((prev) => patchNode(prev, node.code, { expanded: false }));
      return;
    }
    if (node.children && node.children.length > 0) {
      setNodes((prev) => patchNode(prev, node.code, { expanded: true }));
      return;
    }
    setNodes((prev) => patchNode(prev, node.code, { loading: true }));
    try {
      const data = await deptApi.fetchDepartments(node.code, 1, 100);
      const children = (data.list ?? []).map((d) => ({
        ...d,
        expanded: false,
        children: d.hasNext ? [] : undefined,
      }));
      setNodes((prev) =>
        patchNode(prev, node.code, {
          children,
          expanded: true,
          loading: false,
        }),
      );
    } catch {
      setNodes((prev) => patchNode(prev, node.code, { loading: false }));
    }
  }

  function renderNode(node: DeptTreeNode, depth = 0) {
    const hasChildren = Boolean(node.hasNext || node.children?.length);
    return (
      <div key={node.code}>
        <div
          className={clsx(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm cursor-pointer hover:bg-default-100",
            selectedCode === node.code && "bg-accent/15 text-accent font-medium",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren ? (
            <button
              className="w-5 shrink-0 text-muted hover:text-foreground"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node);
              }}
            >
              {node.loading ? "…" : node.expanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <button
            className="flex-1 text-left truncate"
            type="button"
            onClick={() => onSelect(node.code, node)}
          >
            {node.name}
          </button>
        </div>
        {node.expanded && node.children?.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        className={clsx(
          "w-full text-left rounded-lg px-3 py-1.5 text-sm hover:bg-default-100",
          !selectedCode && "bg-accent/15 text-accent font-medium",
        )}
        type="button"
        onClick={() => onSelect(null, null)}
      >
        所有部门
      </button>
      {nodes.map((n) => renderNode(n))}
      {!nodes.length ? <p className="text-xs text-muted px-2 py-4">暂无部门</p> : null}
    </div>
  );
}

function patchNode(
  list: DeptTreeNode[],
  code: string,
  patch: Partial<DeptTreeNode>,
): DeptTreeNode[] {
  return list.map((n) => {
    if (n.code === code) return { ...n, ...patch };
    if (n.children) return { ...n, children: patchNode(n.children, code, patch) };
    return n;
  });
}

export function useDepartmentTreeRefresh() {
  const [key, setKey] = useState(0);
  return { refreshKey: key, refresh: () => setKey((k) => k + 1) };
}
