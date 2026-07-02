import { useEffect, useState } from "react";
import { Card, Spinner } from "@heroui/react";

import * as teamApi from "@/api/team";
import type { DepartmentItem } from "@/api/team";

export default function TeamDepartmentsPage() {
  const [items, setItems] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi
      .fetchDepartments(1, 50)
      .then((d) => setItems(d.list ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((d) => (
          <Card key={d.code} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{d.name || "(未命名部门)"}</p>
              <p className="text-xs text-muted">{d.code}</p>
            </div>
            {d.pcode ? <span className="text-xs text-muted">上级 {d.pcode}</span> : null}
          </Card>
        ))}
        {!items.length ? <Card className="p-8 text-center text-muted">暂无部门</Card> : null}
      </ul>
    </div>
  );
}
