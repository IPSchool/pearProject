import { useEffect, useState } from "react";
import { Card, Chip, Spinner } from "@heroui/react";

import * as teamApi from "@/api/team";
import type { AuthRole } from "@/api/team";

export default function TeamRolesPage() {
  const [items, setItems] = useState<AuthRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi
      .fetchAuthRoles(1, 50)
      .then((d) => setItems(d.list ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{r.title}</p>
              <Chip size="sm" variant="soft">{r.status === 1 ? "启用" : "停用"}</Chip>
            </div>
            <p className="text-sm text-muted mt-1">{r.desc || "—"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
