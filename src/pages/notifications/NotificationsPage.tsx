import { useEffect, useState } from "react";
import { Button, Card, Chip, Spinner } from "@heroui/react";

import * as notifyApi from "@/api/notify";
import { PageHeader } from "@/components/typography";
import { useRealtimeStore } from "@/stores/realtime";
import type { NotificationItem } from "@/types/api";

export default function NotificationsPage() {
  const notifyTick = useRealtimeStore((s) => s.notifyTick);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [noReads, setNoReads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, unread] = await Promise.all([
        notifyApi.fetchNotifications(1, 30),
        notifyApi.fetchNoReads(),
      ]);
      setItems(list.list ?? []);
      setNoReads(unread.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [notifyTick]);

  async function markRead(id: number) {
    setError(null);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item)),
    );
    setNoReads((count) => Math.max(0, count - 1));
    try {
      await notifyApi.markNotificationRead(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "标记已读失败");
      await load();
    }
  }

  async function remove(id: number) {
    try {
      await notifyApi.deleteNotification(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function clearAll() {
    try {
      await notifyApi.clearAllNotifications();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "清空失败");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="tertiary" onPress={clearAll}>
              全部清空
            </Button>
            <Button variant="tertiary" onPress={load}>
              刷新
            </Button>
          </>
        }
        description={`未读 ${noReads} 条`}
        title="通知"
      />

      {error ? <p className="text-danger text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.is_read ? (
                      <Chip color="accent" size="sm" variant="soft">
                        未读
                      </Chip>
                    ) : null}
                    <Chip size="sm" variant="soft">
                      {n.type}
                    </Chip>
                  </div>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-muted mt-2">{n.create_time}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!n.is_read ? (
                    <Button size="sm" variant="tertiary" onPress={() => markRead(n.id)}>
                      已读
                    </Button>
                  ) : null}
                  <Button size="sm" variant="tertiary" onPress={() => remove(n.id)}>
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {!items.length ? (
            <Card className="p-8 text-center text-muted">暂无通知</Card>
          ) : null}
        </ul>
      )}
    </div>
  );
}
