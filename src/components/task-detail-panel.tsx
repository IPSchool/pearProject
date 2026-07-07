import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import {
  Button,
  Chip,
  InputGroup,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import { fetchProjectMembers } from "@/api/member";
import { AddToQuickAccessButton } from "@/components/add-to-quick-access-button";
import { TaskActivityFeed } from "@/components/task-activity-feed";
import { MemberAvatar } from "@/components/member-avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { MarkdownEditor, MarkdownEditorActions } from "@/components/markdown-editor";
import { isTaskClosed } from "@/lib/task-resolution";
import { TaskStatusChip } from "@/components/task-status-chip";
import {
  CLOSED_RESOLUTION_OPTIONS,
  effectiveResolution,
  resolutionLabel,
} from "@/lib/task-resolution";
import {
  TaskParentBreadcrumb,
  TaskParentPicker,
  TaskSubtasksSection,
} from "@/components/task-subtasks-section";
import * as taskApi from "@/api/task";
import * as milestoneApi from "@/api/milestone";
import type { Milestone } from "@/api/milestone";
import * as taskTagApi from "@/api/taskTag";
import { useTaskDetail } from "@/hooks/use-task-detail";
import type { ProjectMember, TaskLogItem, TaskTagItem } from "@/types/api";
import { useAuthStore } from "@/stores/auth";
import { formatReplyComment, isTaskComment } from "@/lib/comment-thread";
import { apiDatetimeToLocal, localDatetimeToApi } from "@/lib/datetime";
import { buildProjectPath, buildTaskPath, taskDisplayKey, taskToUrlInput } from "@/lib/issue-url";

const PRI_OPTIONS = [
  { value: 0, label: "普通" },
  { value: 1, label: "紧急" },
  { value: 2, label: "非常紧急" },
] as const;

const STATUS_OPTIONS = [
  { value: 0, label: "未开始" },
  { value: 2, label: "进行中" },
  { value: 4, label: "测试中" },
  { value: 3, label: "挂起" },
  { value: 1, label: "已完成" },
] as const;

type TabKey = "detail" | "worktime" | "comments";
type ActivityTab = "all" | "comments" | "history" | "worktime";

interface TaskDetailPanelProps {
  taskCode?: string;
  /** 项目 URL 引用（数字 id / prefix / code） */
  projectRef?: string;
  /** 任务 URL 引用（id_num / id / code / ISSUE-KEY） */
  taskRef?: string;
  /** Jira Issue Key，如 KAN-1；与 taskCode 二选一 */
  issueKey?: string;
  highlightCommentId?: number | null;
  onUpdated?: () => void;
  variant?: "drawer" | "page";
}

function SidebarField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-start gap-x-3 gap-y-1 py-2.5 border-b border-separator last:border-b-0">
      <span className="type-hint pt-1.5">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}


export function TaskDetailPanel({
  taskCode: taskCodeProp,
  projectRef,
  taskRef,
  issueKey,
  highlightCommentId = null,
  onUpdated,
  variant = "drawer",
}: TaskDetailPanelProps) {
  const [resolvedTaskCode, setResolvedTaskCode] = useState<string | null>(taskCodeProp ?? null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (taskCodeProp) {
      setResolvedTaskCode(taskCodeProp);
      setResolveError(null);
      return;
    }
    if (projectRef && taskRef) {
      setResolving(true);
      setResolveError(null);
      taskApi
        .fetchTaskByRef(projectRef, taskRef)
        .then((t) => {
          setResolvedTaskCode(t.code);
        })
        .catch((e) => {
          setResolvedTaskCode(null);
          setResolveError(e instanceof Error ? e.message : "任务不存在");
        })
        .finally(() => setResolving(false));
      return;
    }
    if (!issueKey) {
      setResolvedTaskCode(null);
      return;
    }
    setResolving(true);
    setResolveError(null);
    taskApi
      .fetchTaskByIssueKey(issueKey)
      .then((t) => {
        setResolvedTaskCode(t.code);
      })
      .catch((e) => {
        setResolvedTaskCode(null);
        setResolveError(e instanceof Error ? e.message : "Issue 不存在");
      })
      .finally(() => setResolving(false));
  }, [taskCodeProp, projectRef, taskRef, issueKey]);

  const {
    task,
    comments,
    activityLogs,
    workTimes,
    taskTags,
    projectTags,
    loading,
    error,
    reload,
  } = useTaskDetail(resolvedTaskCode, !!resolvedTaskCode);

  const [tab, setTab] = useState<TabKey>("detail");
  const [activityTab, setActivityTab] = useState<ActivityTab>("comments");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<TaskLogItem | null>(null);
  const currentMemberCode = useAuthStore((s) => s.member?.code);
  const [wtNum, setWtNum] = useState("60");
  const [wtContent, setWtContent] = useState("");
  const [wtBegin, setWtBegin] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!task) return;
    const ref =
      task.project_id != null
        ? String(task.project_id)
        : projectRef || task.project_code || "";
    if (!ref) return;
    milestoneApi
      .fetchProjectMilestones(ref)
      .then(setMilestones)
      .catch(() => setMilestones([]));
  }, [task, projectRef]);

  useEffect(() => {
    if (!task) return;
    setEditName(task.name);
    setEditDesc(task.description ?? "");
  }, [task]);

  const loadMembers = useCallback(async (projectCode: string) => {
    try {
      const data = await fetchProjectMembers(projectCode, 1, 100);
      setMembers(data.list ?? []);
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    if (variant === "page" && task?.project_code) {
      void loadMembers(task.project_code);
    }
  }, [variant, task?.project_code, loadMembers]);

  async function refresh() {
    await reload();
    onUpdated?.();
  }

  async function runAction(fn: () => Promise<void>, fallback = "操作失败") {
    setSubmitting(true);
    setActionError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : fallback);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveName() {
    if (!task || !editName.trim()) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { name: editName.trim() });
      setEditingName(false);
    }, "保存标题失败");
  }

  async function saveDescription() {
    if (!task) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { description: editDesc });
      setEditingDesc(false);
    }, "保存描述失败");
  }

  async function changeEndTime(localValue: string) {
    if (!task) return;
    const next = localDatetimeToApi(localValue);
    const current = localDatetimeToApi(apiDatetimeToLocal(task.end_time));
    if (next === current) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { end_time: next });
    }, "更新截止日期失败");
  }

  async function changePri(pri: number) {
    if (!task) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { pri });
    }, "更新优先级失败");
  }

  async function changeStatus(status: number) {
    if (!task) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { status });
    }, "更新状态失败");
  }

  async function changeAssignee(executorCode: string) {
    if (!task) return;
    await runAction(async () => {
      await taskApi.assignTask(task.code, executorCode);
    }, "更新经办人失败");
  }

  async function changeResolution(resolution: string) {
    if (!task) return;
    await runAction(async () => {
      await taskApi.patchTask(task.code, { resolution });
    }, "更新解决方案失败");
  }

  async function toggleDone() {
    if (!task) return;
    await runAction(async () => {
      await taskApi.markTaskDone(task.code, task.done ? 0 : 1);
    }, "更新完成状态失败");
  }

  async function toggleTag(tag: TaskTagItem) {
    if (!task) return;
    await runAction(async () => {
      await taskTagApi.toggleTaskTag(task.code, tag.code);
    }, "设置标签失败");
  }

  async function createAndAttachTag() {
    if (!task?.project_code || !newTagName.trim()) return;
    await runAction(async () => {
      const created = await taskTagApi.createTaskTag(task.project_code!, newTagName.trim());
      if (created?.code) {
        await taskTagApi.toggleTaskTag(task.code, created.code);
      }
      setNewTagName("");
    }, "创建标签失败");
  }

  async function submitComment() {
    if (!task || !comment.trim()) return;
    let body = comment.trim();
    if (replyTo) {
      const author = replyTo.member_name ?? replyTo.member?.name ?? "用户";
      body = formatReplyComment(author, body);
    }
    await runAction(async () => {
      await taskApi.createComment(task.code, body);
      setComment("");
      setReplyTo(null);
      setActivityTab("comments");
    }, replyTo ? "回复失败" : "评论失败");
  }

  function handleReply(item: TaskLogItem) {
    const author = item.member_name ?? item.member?.name ?? "用户";
    setReplyTo(item);
    setComment(`@${author} `);
    setActivityTab("comments");
    setTab("comments");
  }

  const handleReactionsChange = useCallback(() => {
    /* 反应计数由 TaskCommentItem 本地 state 维护 */
  }, []);

  async function submitWorkTime() {
    if (!task || !wtNum.trim() || !wtBegin.trim()) return;
    await runAction(async () => {
      await taskApi.saveTaskWorkTime(
        task.code,
        Number(wtNum),
        wtContent.trim(),
        wtBegin.trim(),
      );
      setWtContent("");
      setActivityTab("worktime");
    }, "登记工时失败");
  }

  const fullPageHref = task ? buildTaskPath(taskToUrlInput(task)) : null;

  const drawerTabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "detail", label: "详情" },
    { key: "worktime", label: "工时", badge: workTimes.length },
    { key: "comments", label: "评论", badge: comments.length },
  ];

  const historyLogs = activityLogs.filter((l) => !isTaskComment(l));

  const activityTabs: { key: ActivityTab; label: string; badge?: number }[] = [
    { key: "all", label: "全部", badge: activityLogs.length },
    { key: "comments", label: "评论", badge: comments.length },
    { key: "history", label: "历史记录", badge: historyLogs.length },
    { key: "worktime", label: "工作时间日志", badge: workTimes.length },
  ];

  function statusSelect(className?: string) {
    if (!task) return null;
    return (
      <Select
        aria-label="状态"
        selectedKey={String(task.status ?? 0)}
        onSelectionChange={(key) => {
          const v = Number(key);
          if (v !== (task.status ?? 0)) void changeStatus(v);
        }}
      >
        <Select.Trigger
          className={clsx(
            "w-full min-h-9 font-medium",
            variant === "page" &&
              "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]",
            className,
          )}
        >
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {STATUS_OPTIONS.map((o) => (
              <ListBox.Item key={o.value} id={String(o.value)} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  function resolutionSelect(className?: string) {
    if (!task || !isTaskClosed(task)) {
      return (
        <span className="type-body text-subtle" title="将状态设为「已完成」后可选择解决方案">
          {resolutionLabel(null)}
        </span>
      );
    }
    const current = effectiveResolution(task) ?? "fixed";
    return (
      <Select
        aria-label="解决方案"
        selectedKey={current}
        onSelectionChange={(key) => {
          const v = String(key);
          if (v !== current) void changeResolution(v);
        }}
      >
        <Select.Trigger className={clsx("w-full min-h-9", className)}>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {CLOSED_RESOLUTION_OPTIONS.map((o) => (
              <ListBox.Item key={o.value} id={o.value} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  function priSelect(compact?: boolean) {
    if (!task) return null;
    return (
      <Select
        aria-label="优先级"
        selectedKey={String(task.pri ?? 0)}
        onSelectionChange={(key) => {
          const v = Number(key);
          if (v !== (task.pri ?? 0)) void changePri(v);
        }}
      >
        <Select.Trigger className={clsx("w-full", compact ? "min-h-8 h-8 border-0 bg-transparent px-0 shadow-none" : "min-h-9")}>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {PRI_OPTIONS.map((o) => (
              <ListBox.Item key={o.value} id={String(o.value)} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  function assigneeSelect() {
    if (!task) return null;
    return (
      <Select
        aria-label="经办人"
        selectedKey={task.assign_to ?? task.executor?.code ?? ""}
        onSelectionChange={(key) => {
          if (key != null) void changeAssignee(String(key));
        }}
      >
        <Select.Trigger className="min-h-8 h-auto border-0 bg-transparent px-0 shadow-none">
          <div className="flex items-center gap-2">
            <MemberAvatar
              name={task.executor?.name ?? "?"}
              src={task.executor?.avatar}
            />
            <Select.Value />
          </div>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="" textValue="未分配">
              未分配
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {members.map((m) => (
              <ListBox.Item key={m.code} id={m.code} textValue={m.name}>
                {m.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  function dueDateField() {
    if (!task) return null;
    const localValue = apiDatetimeToLocal(task.end_time);
    return (
      <div className="flex min-w-0 items-center gap-1">
        <InputGroup className="min-w-0 flex-1">
          <InputGroup.Input
            aria-label="截止日期"
            className="h-8 min-h-8 w-full border-0 bg-transparent px-0 shadow-none scheme-light dark:scheme-dark type-body"
            disabled={submitting}
            type="datetime-local"
            value={localValue}
            onChange={(e) => void changeEndTime(e.target.value)}
          />
        </InputGroup>
        {localValue ? (
          <button
            className="shrink-0 rounded px-1.5 py-0.5 type-hint text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground"
            disabled={submitting}
            title="清除截止日期"
            type="button"
            onClick={() => void changeEndTime("")}
          >
            清除
          </button>
        ) : null}
      </div>
    );
  }

  function descriptionBlock() {
    if (!task) return null;
    const hasContent = Boolean(task.description?.trim());

    return (
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="type-heading-xsmall text-subtle">描述</h2>
          {!editingDesc ? (
            <Button size="sm" variant="tertiary" onPress={() => setEditingDesc(true)}>
              {hasContent ? "编辑" : "添加描述"}
            </Button>
          ) : null}
        </div>
        {editingDesc ? (
          <MarkdownEditor
            minHeight="14rem"
            placeholder="支持 Markdown，可粘贴 emoji、表格与代码块…"
            value={editDesc}
            footer={
              <MarkdownEditorActions
                submitting={submitting}
                onCancel={() => {
                  setEditDesc(task.description ?? "");
                  setEditingDesc(false);
                }}
                onSave={() => void saveDescription()}
              />
            }
            onChange={setEditDesc}
          />
        ) : hasContent ? (
          <div
            className="group cursor-pointer rounded-lg border border-transparent px-1 py-0.5 hover:border-separator hover:bg-surface-sunken/50"
            role="button"
            tabIndex={0}
            onClick={() => setEditingDesc(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEditingDesc(true);
              }
            }}
          >
            <MarkdownContent source={task.description ?? ""} />
          </div>
        ) : (
          <button
            className="w-full rounded-lg border border-dashed border-separator px-4 py-8 text-center type-hint transition-colors hover:border-[var(--ads-color-brand)] hover:bg-surface-sunken/50"
            type="button"
            onClick={() => setEditingDesc(true)}
          >
            添加描述…（支持 Markdown）
          </button>
        )}
      </section>
    );
  }

  function milestoneSelect() {
    if (!task) return null;
    const current = task.milestone?.code ?? "";
    return (
      <Select
        aria-label="里程碑"
        selectedKey={current || "none"}
        onSelectionChange={(key) => {
          const value = String(key ?? "none");
          void runAction(
            () =>
              milestoneApi.setTaskMilestone(
                task.code,
                value === "none" ? null : value,
              ),
            "更新里程碑失败",
          );
        }}
      >
        <Select.Trigger className="w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="none" textValue="无">
              无
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {milestones.map((m) => (
              <ListBox.Item key={m.code} id={m.code} textValue={m.name}>
                {m.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  function tagsBlock(inSidebar = false) {
    if (!task) return null;
    return (
      <div className={inSidebar ? "space-y-2" : "space-y-3"}>
        <div className="flex flex-wrap gap-1.5">
          {taskTags.length ? (
            taskTags.map((tag) => (
              <Chip
                key={tag.code}
                className="cursor-pointer gap-1"
                color="accent"
                size="sm"
                variant="soft"
                onClick={() => toggleTag(tag)}
              >
                {tag.name}
                <span aria-hidden className="opacity-70">
                  ×
                </span>
              </Chip>
            ))
          ) : (
            <span className="type-hint">无</span>
          )}
        </div>
        {!inSidebar && projectTags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {projectTags
              .filter((tag) => !taskTags.some((t) => t.code === tag.code))
              .map((tag) => (
                <Chip
                  key={tag.code}
                  className="cursor-pointer"
                  size="sm"
                  variant="soft"
                  onClick={() => toggleTag(tag)}
                >
                  + {tag.name}
                </Chip>
              ))}
          </div>
        ) : null}
        {!inSidebar && task.project_code ? (
          <div className="flex flex-wrap gap-2">
            <InputGroup className="max-w-xs flex-1">
              <InputGroup.Input
                placeholder="新建标签"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void createAndAttachTag();
                }}
              />
            </InputGroup>
            <Button isPending={submitting} size="sm" variant="secondary" onPress={createAndAttachTag}>
              新建
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function activityFeedBlock(
    items: TaskLogItem[],
    showComposer: boolean,
    feedMode: ActivityTab = "all",
  ) {
    if (!task?.project_code) {
      return (
        <ul className="space-y-4">
          {!items.length ? <li className="type-hint py-4">暂无记录</li> : null}
        </ul>
      );
    }
    return (
      <TaskActivityFeed
        comment={comment}
        currentMemberCode={currentMemberCode}
        feedMode={feedMode}
        highlightCommentId={highlightCommentId}
        items={items}
        taskUrl={taskToUrlInput(task)}
        replyTo={replyTo}
        showComposer={showComposer}
        submitting={submitting}
        onCancelReply={() => setReplyTo(null)}
        onCommentChange={setComment}
        onReload={() => void reload()}
        onReactionsChange={handleReactionsChange}
        onReply={handleReply}
        onSubmitComment={() => void submitComment()}
      />
    );
  }

  function workTimePanel() {
    return (
      <div className="space-y-4">
        <ul className="space-y-2">
          {workTimes.map((w, i) => (
            <li key={w.id ?? i} className="type-body border-b border-separator pb-2 text-subtle last:border-0">
              {w.begin_time} · {w.work_time ?? w.num ?? "—"} 分钟
              {w.content ? ` — ${w.content}` : ""}
            </li>
          ))}
          {!workTimes.length ? <li className="type-hint">暂无工时记录</li> : null}
        </ul>
        <div className="rounded-lg border border-separator p-3 space-y-3">
          <p className="type-label">登记工时</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <TextField name="wtNum">
              <Label>分钟</Label>
              <InputGroup>
                <InputGroup.Input value={wtNum} onChange={(e) => setWtNum(e.target.value)} />
              </InputGroup>
            </TextField>
            <TextField className="sm:col-span-2" name="wtBegin">
              <Label>开始时间</Label>
              <InputGroup>
                <InputGroup.Input
                  placeholder="2030-01-01 09:00:00"
                  value={wtBegin}
                  onChange={(e) => setWtBegin(e.target.value)}
                />
              </InputGroup>
            </TextField>
          </div>
          <TextField name="wtContent">
            <Label>说明</Label>
            <InputGroup>
              <InputGroup.Input value={wtContent} onChange={(e) => setWtContent(e.target.value)} />
            </InputGroup>
          </TextField>
          <Button isPending={submitting} size="sm" onPress={submitWorkTime}>
            登记工时
          </Button>
        </div>
      </div>
    );
  }

  if (resolving || loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (resolveError || error || !task) {
    return (
      <p className="text-danger type-body">{resolveError ?? error ?? "任务不存在"}</p>
    );
  }

  if (variant === "page") {
    const activityItems =
      activityTab === "comments"
        ? comments
        : activityTab === "history"
          ? historyLogs
          : activityTab === "worktime"
            ? []
            : activityLogs;

    return (
      <div className="space-y-4">
        {actionError ? (
          <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{actionError}</p>
        ) : null}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* 主栏：标题 + 描述 + 活动 */}
          <div className="min-w-0 flex-1 space-y-6">
            <header className="space-y-2">
              {task.parentTasks?.length ? (
                <TaskParentBreadcrumb
                  parents={task.parentTasks}
                  projectCode={task.project_code}
                  projectId={task.project_id}
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-2 type-hint">
                {task.project_code ? (
                  <Link
                    className="hover:text-[var(--ads-color-link)] hover:underline"
                    to={
                      task.project_id != null
                        ? buildProjectPath(task.project_id, "tasks")
                        : task.project_code
                          ? `/project/${task.project_code}/tasks`
                          : "#"
                    }
                  >
                    {task.projectName ?? "项目"}
                  </Link>
                ) : null}
                <span>/</span>
                <Link
                  className="font-medium text-[var(--ads-color-text-selected)] hover:underline"
                  to={buildTaskPath(taskToUrlInput(task))}
                >
                  {taskDisplayKey(taskToUrlInput(task))}
                </Link>
                {task.done ? <TaskStatusChip task={task} /> : null}
              </div>

              {!task.issueKey && task.project_id != null && task.id_num != null ? (
                <p className="type-hint">
                  当前编号{" "}
                  <span className="font-mono text-foreground">{task.id_num}</span>
                  （数字路径）。{" "}
                  <Link
                    className="text-[var(--ads-color-link)] hover:underline"
                    to={buildProjectPath(task.project_id, "settings")}
                  >
                    在项目设置中启用 Issue Key
                  </Link>{" "}
                  可升级为 KAN-1 格式链接。
                </p>
              ) : null}

              {editingName ? (
                <div className="flex flex-wrap gap-2">
                  <TextField className="min-w-[12rem] flex-1" name="editName">
                    <InputGroup>
                      <InputGroup.Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </InputGroup>
                  </TextField>
                  <Button isPending={submitting} size="sm" onPress={saveName}>
                    保存
                  </Button>
                  <Button size="sm" variant="tertiary" onPress={() => setEditingName(false)}>
                    取消
                  </Button>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <h1 className="type-heading-large flex-1">{task.name}</h1>
                  <AddToQuickAccessButton
                    href={buildTaskPath(taskToUrlInput(task))}
                    kind="task"
                    label={`${taskDisplayKey(taskToUrlInput(task))} · ${task.name}`}
                    subtitle={task.projectName}
                    variant="icon"
                  />
                  <Button
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    size="sm"
                    variant="tertiary"
                    onPress={() => setEditingName(true)}
                  >
                    编辑
                  </Button>
                </div>
              )}
            </header>

            {descriptionBlock()}

            <TaskSubtasksSection compact={false} task={task} onUpdated={() => void refresh()} />

            <section>
              <h2 className="type-heading-xsmall mb-3 text-subtle">活动</h2>
              <div className="flex gap-1 border-b border-separator">
                {activityTabs.map((t) => (
                  <button
                    key={t.key}
                    className={clsx(
                      "px-3 py-2 type-body -mb-px border-b-2 transition-colors",
                      activityTab === t.key
                        ? "border-[var(--ads-color-brand)] font-medium text-[var(--ads-color-text-selected)]"
                        : "border-transparent text-subtle hover:text-foreground",
                    )}
                    type="button"
                    onClick={() => setActivityTab(t.key)}
                  >
                    {t.label}
                    {t.badge ? ` (${t.badge})` : ""}
                  </button>
                ))}
              </div>
              <div className="pt-4">
                {activityTab === "worktime" ? (
                  workTimePanel()
                ) : (
                  activityFeedBlock(
                    activityItems,
                    activityTab === "comments" || activityTab === "all",
                    activityTab,
                  )
                )}
              </div>
            </section>
          </div>

          {/* 侧栏：状态 + 详细信息 */}
          <aside className="w-full shrink-0 lg:w-72 lg:border-l lg:border-separator lg:pl-6">
            <div className="space-y-3">
              {statusSelect()}
              <SidebarField label="解决方案">{resolutionSelect()}</SidebarField>
              <Button
                fullWidth
                isPending={submitting}
                size="sm"
                variant="secondary"
                onPress={toggleDone}
              >
                {task.done ? "标记未完成" : "标记完成"}
              </Button>
            </div>

            <h3 className="type-label mb-1 mt-6 text-subtlest">详细信息</h3>
            <div>
              <SidebarField label="经办人">{assigneeSelect()}</SidebarField>
              <SidebarField label="优先级">{priSelect(true)}</SidebarField>
              <SidebarField label="父项">
                <TaskParentPicker
                  compact
                  task={task}
                  onUpdated={() => void refresh()}
                />
              </SidebarField>
              <SidebarField label="截止日期">{dueDateField()}</SidebarField>
              <SidebarField label="里程碑">{milestoneSelect()}</SidebarField>
              <SidebarField label="标签">{tagsBlock(true)}</SidebarField>
              <SidebarField label="报告人">
                {task.creator?.name ? (
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={task.creator.name} src={task.creator.avatar} />
                    <span className="type-body">{task.creator.name}</span>
                  </div>
                ) : (
                  <span className="type-hint">—</span>
                )}
              </SidebarField>
            </div>

            {task.create_time ? (
              <p className="type-hint mt-6">已创建 {task.create_time}</p>
            ) : null}
          </aside>
        </div>
      </div>
    );
  }

  /* drawer 布局保持紧凑单栏 */
  return (
    <div className="space-y-4">
      {actionError ? (
        <p className="text-danger type-body rounded-md bg-danger/10 px-3 py-2">{actionError}</p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {editingName ? (
            <div className="flex flex-wrap gap-2">
              <TextField className="min-w-[12rem] flex-1" name="editName">
                <InputGroup>
                  <InputGroup.Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </InputGroup>
              </TextField>
              <Button isPending={submitting} size="sm" onPress={saveName}>
                保存
              </Button>
              <Button size="sm" variant="tertiary" onPress={() => setEditingName(false)}>
                取消
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="type-heading-medium">{task.name}</h2>
              <Button size="sm" variant="tertiary" onPress={() => setEditingName(true)}>
                编辑
              </Button>
            </div>
          )}
          <p className="type-hint">
            {task.projectName ? `项目：${task.projectName}` : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {fullPageHref ? (
            <Link
              className="inline-flex items-center rounded-md border border-separator px-3 py-1.5 type-body-small hover:bg-[var(--ads-color-background-neutral)]"
              target="_blank"
              to={fullPageHref}
            >
              在新页面打开
            </Link>
          ) : null}
          <Button isPending={submitting} size="sm" variant="secondary" onPress={toggleDone}>
            {task.done ? "标记未完成" : "标记完成"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="type-label mb-1 block">状态</Label>
          {statusSelect()}
        </div>
        <div>
          <Label className="type-label mb-1 block">优先级</Label>
          {priSelect()}
        </div>
      </div>

      <div className="flex gap-1 border-b border-separator">
        {drawerTabs.map((t) => (
          <button
            key={t.key}
            className={clsx(
              "px-3 py-2 type-body-small -mb-px border-b-2 transition-colors",
              tab === t.key
                ? "border-[var(--ads-color-brand)] font-medium text-[var(--ads-color-text-selected)]"
                : "border-transparent text-subtle hover:text-foreground",
            )}
            type="button"
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge ? ` (${t.badge})` : ""}
          </button>
        ))}
      </div>

      {tab === "detail" ? (
        <div className="space-y-4">
          {task.parentTasks?.length ? (
            <TaskParentBreadcrumb
              parents={task.parentTasks}
              projectCode={task.project_code}
              projectId={task.project_id}
            />
          ) : null}
          {descriptionBlock()}
          <div>
            <p className="type-label mb-2">父项</p>
            <TaskParentPicker task={task} onUpdated={() => void refresh()} />
          </div>
          <TaskSubtasksSection compact task={task} onUpdated={() => void refresh()} />
          <div>
            <p className="type-label mb-2">标签</p>
            {tagsBlock()}
          </div>
        </div>
      ) : null}
      {tab === "worktime" ? workTimePanel() : null}
      {tab === "comments" ? activityFeedBlock(comments, true, "comments") : null}
    </div>
  );
}
