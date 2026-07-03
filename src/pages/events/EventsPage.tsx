import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import * as eventsApi from "@/api/events";
import type { EventItem } from "@/api/events";
import { fetchSelfProjects } from "@/api/project";
import type { ProjectSummary } from "@/types/api";

const tabs = [
  { key: "all", label: "全部日程" },
  { key: "mine", label: "我的日程" },
  { key: "confirm", label: "待确认" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function EventsPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [title, setTitle] = useState("");
  const [beginTime, setBeginTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (tab === "mine") data = await eventsApi.fetchMyEvents();
      else if (tab === "confirm") data = await eventsApi.fetchConfirmEvents();
      else data = await eventsApi.fetchEvents();
      setEvents(data.list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchSelfProjects(1, 30)
      .then((d) => {
        setProjects(d.list ?? []);
        if (d.list?.[0]?.code) setProjectCode(d.list[0].code);
      })
      .catch(() => setProjects([]));
  }, []);

  async function handleCreate() {
    if (!projectCode || !title.trim() || !beginTime || !endTime) return;
    setSaving(true);
    try {
      await eventsApi.createEvent({
        projectCode,
        title: title.trim(),
        beginTime,
        endTime,
      });
      setOpen(false);
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(code: string) {
    try {
      await eventsApi.confirmEvent(code, 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "确认失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">日程</h2>
          <p className="text-sm text-muted mt-1">Legacy `project/events/*`</p>
        </div>
        <Button onPress={() => setOpen(true)}>新建日程</Button>
      </div>

      <div className="flex gap-1 border-b border-separator">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent font-medium"
                : "border-transparent text-muted hover:text-foreground"
            }`}
            type="button"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev.code} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-sm text-muted mt-1">
                    {ev.begin_time} — {ev.end_time}
                  </p>
                  {ev.projectName ? (
                    <p className="text-xs text-muted mt-1">项目：{ev.projectName}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {ev.waitConfirm ? (
                    <Button size="sm" onPress={() => handleConfirm(ev.code)}>
                      确认参加
                    </Button>
                  ) : null}
                  {tab === "confirm" ? (
                    <Button size="sm" onPress={() => handleConfirm(ev.code)}>
                      接受邀请
                    </Button>
                  ) : null}
                  {ev.all_day ? (
                    <Chip size="sm" variant="soft">
                      全天
                    </Chip>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
          {!events.length ? (
            <Card className="p-8 text-center text-muted">暂无日程</Card>
          ) : null}
        </div>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>新建日程</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <Select
                aria-label="项目"
                selectedKey={projectCode}
                onSelectionChange={(key) => setProjectCode(String(key))}
              >
                <Label>所属项目</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {projects.map((p) => (
                      <ListBox.Item key={p.code} id={p.code} textValue={p.name}>
                        {p.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField isRequired name="title">
                <Label>标题</Label>
                <InputGroup>
                  <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField isRequired name="begin">
                <Label>开始时间</Label>
                <InputGroup>
                  <InputGroup.Input
                    placeholder="2030-01-01 10:00:00"
                    value={beginTime}
                    onChange={(e) => setBeginTime(e.target.value)}
                  />
                </InputGroup>
              </TextField>
              <TextField isRequired name="end">
                <Label>结束时间</Label>
                <InputGroup>
                  <InputGroup.Input
                    placeholder="2030-01-01 11:00:00"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={handleCreate}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
