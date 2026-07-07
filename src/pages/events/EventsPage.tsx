import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import {
  Button,
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
import { DatetimeInput } from "@/components/datetime-input";
import { SimpleDataTable } from "@/components/simple-data-table";
import { PageHeader } from "@/components/typography";
import {
  apiDatetimeToLocal,
  defaultDatetimeRange,
  formatListDateTime,
  localDatetimeToApi,
  pickDateField,
} from "@/lib/datetime";
import type { ProjectSummary } from "@/types/api";

const tabs = [
  { key: "all", label: "全部日程" },
  { key: "mine", label: "我的日程" },
  { key: "confirm", label: "待确认" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type EventFormState = {
  projectCode: string;
  title: string;
  beginLocal: string;
  endLocal: string;
};

function eventBeginTime(ev: EventItem) {
  return pickDateField(ev, "begin_time", "beginTime");
}

function eventEndTime(ev: EventItem) {
  return pickDateField(ev, "end_time", "endTime");
}

function emptyForm(projectCode: string): EventFormState {
  const { begin, end } = defaultDatetimeRange();
  return { projectCode, title: "", beginLocal: begin, endLocal: end };
}

function formFromEvent(ev: EventItem): EventFormState {
  return {
    projectCode: ev.project_code ?? "",
    title: ev.title ?? "",
    beginLocal: apiDatetimeToLocal(eventBeginTime(ev)),
    endLocal: apiDatetimeToLocal(eventEndTime(ev)),
  };
}

export default function EventsPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm(""));
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
    void load();
  }, [load]);

  useEffect(() => {
    fetchSelfProjects(1, 50)
      .then((d) => {
        const list = d.list ?? [];
        setProjects(list);
        if (list[0]?.code) {
          setForm((prev) => (prev.projectCode ? prev : emptyForm(list[0].code)));
        }
      })
      .catch(() => setProjects([]));
  }, []);

  function openCreate() {
    const code = form.projectCode || projects[0]?.code || "";
    setForm(emptyForm(code));
    setEditingCode(null);
    setModalMode("create");
  }

  function openEdit(ev: EventItem) {
    setForm(formFromEvent(ev));
    setEditingCode(ev.code);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingCode(null);
  }

  async function handleSave() {
    if (!form.projectCode || !form.title.trim() || !form.beginLocal || !form.endLocal) {
      setError("请填写标题与开始、结束时间");
      return;
    }
    const beginTime = localDatetimeToApi(form.beginLocal);
    const endTime = localDatetimeToApi(form.endLocal);
    if (new Date(beginTime.replace(/-/g, "/")) >= new Date(endTime.replace(/-/g, "/"))) {
      setError("结束时间须晚于开始时间");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (modalMode === "edit" && editingCode) {
        await eventsApi.updateEvent(editingCode, {
          projectCode: form.projectCode,
          title: form.title.trim(),
          beginTime,
          endTime,
        });
      } else {
        await eventsApi.createEvent({
          projectCode: form.projectCode,
          title: form.title.trim(),
          beginTime,
          endTime,
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(code: string) {
    setConfirming(code);
    try {
      await eventsApi.confirmEvent(code, 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "确认失败");
    } finally {
      setConfirming(null);
    }
  }

  const showConfirmAction = tab === "confirm";

  return (
    <div className="space-y-4">
      <PageHeader
        actions={<Button onPress={openCreate}>新建日程</Button>}
        description="查看与管理个人及项目日程"
        title="日程"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-separator">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={clsx(
                "type-body px-4 py-2.5 -mb-px border-b-2 transition-colors",
                tab === t.key
                  ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
              type="button"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!loading ? <p className="type-meta">共 {events.length} 条</p> : null}
      </div>

      {error && !modalMode ? (
        <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-separator">
          <SimpleDataTable
            emptyHint={
              tab === "confirm" ? "暂无待确认日程" : tab === "mine" ? "暂无我的日程" : "暂无日程"
            }
            headers={["标题", "项目", "开始时间", "结束时间", "操作"]}
            rows={events.map((ev) => {
              const begin = eventBeginTime(ev);
              const end = eventEndTime(ev);
              return {
                key: ev.code,
                cells: [
                  <span
                    key="title"
                    className="type-body inline-flex flex-wrap items-center gap-2 font-medium"
                  >
                    {ev.title || "（无标题）"}
                    {ev.all_day ? (
                      <Chip size="sm" variant="soft">
                        全天
                      </Chip>
                    ) : null}
                  </span>,
                  <span key="project" className="type-body text-subtle">
                    {ev.projectName || ev.project_code || "—"}
                  </span>,
                  <button
                    key="begin"
                    className="type-body whitespace-nowrap text-left text-subtle hover:text-foreground hover:underline"
                    title="点击编辑时间"
                    type="button"
                    onClick={() => openEdit(ev)}
                  >
                    {formatListDateTime(begin)}
                  </button>,
                  <button
                    key="end"
                    className="type-body whitespace-nowrap text-left text-subtle hover:text-foreground hover:underline"
                    title="点击编辑时间"
                    type="button"
                    onClick={() => openEdit(ev)}
                  >
                    {formatListDateTime(end)}
                  </button>,
                ],
                action: (
                  <div className="flex justify-end gap-2">
                    {showConfirmAction || ev.waitConfirm ? (
                      <Button
                        isPending={confirming === ev.code}
                        size="sm"
                        variant="secondary"
                        onPress={() => void handleConfirm(ev.code)}
                      >
                        {showConfirmAction ? "接受邀请" : "确认参加"}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="tertiary" onPress={() => openEdit(ev)}>
                      编辑
                    </Button>
                  </div>
                ),
              };
            })}
          />
        </div>
      )}

      <Modal.Backdrop isOpen={modalMode !== null} onOpenChange={(open) => !open && closeModal()}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{modalMode === "edit" ? "编辑日程" : "新建日程"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {error && modalMode ? (
                <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{error}</p>
              ) : null}
              <Select
                aria-label="项目"
                selectedKey={form.projectCode}
                onSelectionChange={(key) =>
                  setForm((prev) => ({ ...prev, projectCode: String(key) }))
                }
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
                  <InputGroup.Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </InputGroup>
              </TextField>
              <DatetimeInput
                isRequired
                label="开始时间"
                value={form.beginLocal}
                onChange={(beginLocal) => setForm((prev) => ({ ...prev, beginLocal }))}
              />
              <DatetimeInput
                isRequired
                label="结束时间"
                value={form.endLocal}
                onChange={(endLocal) => setForm((prev) => ({ ...prev, endLocal }))}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={closeModal}>
                取消
              </Button>
              <Button isPending={saving} onPress={() => void handleSave()}>
                {modalMode === "edit" ? "保存" : "创建"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
