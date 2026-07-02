import { useEffect, useState } from "react";
import { Card, Spinner } from "@heroui/react";

import * as teamApi from "@/api/team";

export default function TeamAccountsPage() {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi
      .fetchAccounts(1, 10)
      .then((d) => setTotal(d.total ?? d.list?.length ?? 0))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <Card className="p-6">
      {error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : (
        <>
          <p className="font-medium">组织成员账户</p>
          <p className="text-3xl font-bold mt-2">{total}</p>
          <p className="text-sm text-muted mt-2">
            对接 Legacy `account/index`；详细列表与授权在后续 Phase 扩展。
          </p>
        </>
      )}
    </Card>
  );
}
