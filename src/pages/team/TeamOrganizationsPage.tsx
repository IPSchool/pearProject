import { useEffect, useState } from "react";
import { Card, Chip, Spinner } from "@heroui/react";

import * as teamApi from "@/api/team";
import type { OrganizationItem } from "@/api/team";

export default function TeamOrganizationsPage() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi
      .fetchOrganizations(1, 50)
      .then((d) => setItems(d.list ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((o) => (
          <Card key={o.code} className="p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{o.name}</p>
              {o.personal ? <Chip size="sm" variant="soft">个人</Chip> : null}
            </div>
            <p className="text-sm text-muted mt-1">{o.description || "—"}</p>
            <p className="text-xs text-muted mt-2">{o.create_time}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
