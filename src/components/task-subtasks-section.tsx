import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button, InputGroup, ListBox, Select } from "@heroui/react";
import type { Key } from "react-aria-components";

import * as taskApi from "@/api/task";
import { MemberAvatar } from "@/components/member-avatar";
import { buildTaskPath, taskDisplayKey, taskToUrlInput } from "@/lib/issue-url";
import type { TaskItem, TaskParentRef } from "@/types/api";

const PARENT_NONE_ID = "__none__";

function isDescendantOf(
  candidateCode: string,
  ancestorCode: string,
  byCode: Map<string, TaskItem>,
): boolean {
  let current = candidateCode;
  const seen = new Set<string>();
  while (current) {
    if (current === ancestorCode) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    const row = byCode.get(current);
    if (!row?.pcode) return false;
    current = row.pcode;
  }
  return false;
}

function parentLabel(
  task: Pick<TaskItem, "name" | "code" | "issueKey" | "id_num"> | TaskParentRef,
): string {
  const title =
    task.name?.trim() ||
    taskApi.taskDisplayTitle({
      name: task.name ?? "",
      code: task.code,
      id_num: task.id_num,
      issueKey: task.issueKey,
    });
  const key = taskDisplayKey(taskToUrlInput({ ...task, code: task.code }));
  return key ? `${key} · ${title}` : title;
}

function parentTaskPath(
  parent: TaskParentRef,
  ctx: Pick<TaskItem, "project_id" | "project_code">,
): string {
  return buildTaskPath(
    taskToUrlInput({
      ...parent,
      projectId: parent.project_id ?? ctx.project_id,
      project_code: parent.project_code ?? ctx.project_code,
      code: parent.code,
    }),
  );
}

export function TaskParentBreadcrumb({
  parents,
  projectId,
  projectCode,
}: {
  parents: TaskParentRef[];
  projectId?: number;
  projectCode?: string;
}) {
  if (!parents.length) return null;
  return (
    <nav aria-label="父任务" className="flex flex-wrap items-center gap-1 type-hint">
      {parents.map((p, i) => (
        <span key={p.code} className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-subtlest">/</span> : null}
          <Link
            className="max-w-[14rem] truncate hover:text-[var(--ads-color-link)] hover:underline"
            title={p.name}
            to={parentTaskPath(p, { project_id: projectId, project_code: projectCode })}
          >
            {p.name || taskDisplayKey(taskToUrlInput({ ...p, code: p.code }))}
          </Link>
        </span>
      ))}
      <span className="text-subtlest">/</span>
    </nav>
  );
}

export function TaskParentPicker({
  task,
  onUpdated,
  compact = false,
}: {
  task: TaskItem;
  onUpdated?: () => void;
  compact?: boolean;
}) {
  const [candidates, setCandidates] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!task.project_code) return;
    setLoading(true);
    taskApi
      .fetchProjectTasks(task.project_code, 1, 500)
      .then((data) => setCandidates(data.list ?? []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [task.project_code]);

  const parentOptions = useMemo(() => {
    const byCode = new Map(candidates.map((t) => [t.code, t]));
    return candidates.filter((c) => {
      if (c.code === task.code) return false;
      if (isDescendantOf(c.code, task.code, byCode)) return false;
      if (c.done) return false;
      return true;
    });
  }, [candidates, task.code]);

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return parentOptions;
    return parentOptions.filter((c) => {
      const label = parentLabel(c).toLowerCase();
      return label.includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [filter, parentOptions]);

  const currentParent =
    task.parentTask ??
    (task.pcode ? candidates.find((c) => c.code === task.pcode) : undefined);

  const parentCodeRef = useRef(task.pcode ?? "");
  parentCodeRef.current = task.pcode ?? "";

  const changeParent = useCallback(
    async (key: Key | null) => {
      const parentCode =
        key == null || key === PARENT_NONE_ID ? "" : String(key);
      if (parentCode === parentCodeRef.current) return;
      setSubmitting(true);
      setError(null);
      try {
        await taskApi.setTaskParent(task.code, parentCode);
        setFilter("");
        onUpdated?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "设置父项失败");
      } finally {
        setSubmitting(false);
      }
    },
    [onUpdated, task.code],
  );

  return (
    <div className="space-y-1">
      <Select
        aria-label="父项"
        isDisabled={submitting || loading}
        selectedKey={task.pcode || PARENT_NONE_ID}
        onSelectionChange={(key) => void changeParent(key)}
      >
        <Select.Trigger
          className={clsx(
            "w-full",
            compact ? "min-h-8 h-8 border-0 bg-transparent px-0 shadow-none" : "min-h-9",
          )}
        >
          <Select.Value>
            {({ defaultChildren, isPlaceholder }) => {
              if (!isPlaceholder && currentParent) {
                return (
                  <Link
                    className="truncate text-[var(--ads-color-link)] hover:underline"
                    to={parentTaskPath(currentParent, task)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentParent.name || parentLabel(currentParent)}
                  </Link>
                );
              }
              return defaultChildren;
            }}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover className="max-w-md">
          <div className="border-b border-separator p-2">
            <InputGroup>
              <InputGroup.Input
                placeholder="搜索任务…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </InputGroup>
          </div>
          <ListBox>
            <ListBox.Item id={PARENT_NONE_ID} textValue="无">
              无
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {filteredOptions.map((c) => (
              <ListBox.Item key={c.code} id={c.code} textValue={parentLabel(c)}>
                <span className="truncate">{parentLabel(c)}</span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            {!loading && !filteredOptions.length ? (
              <ListBox.Item id="__empty__" isDisabled textValue="无可选任务">
                无可选父任务
              </ListBox.Item>
            ) : null}
          </ListBox>
        </Select.Popover>
      </Select>
      {error ? <p className="type-hint text-danger">{error}</p> : null}
    </div>
  );
}

export function TaskParentField({
  task,
}: {
  task: Pick<
    TaskItem,
    "pcode" | "parentTask" | "parentTasks" | "project_id" | "project_code"
  >;
}) {
  const parent = task.parentTask;
  const parents = task.parentTasks;
  if (!task.pcode || (!parent && !parents?.length)) {
    return <span className="type-hint">无</span>;
  }
  const linkTarget = parent ?? parents?.[parents.length - 1];
  if (!linkTarget) return <span className="type-hint">无</span>;
  return (
    <Link
      className="type-body text-[var(--ads-color-link)] hover:underline"
      to={parentTaskPath(linkTarget, task)}
    >
      {linkTarget.name || taskDisplayKey(taskToUrlInput({ ...linkTarget, code: linkTarget.code }))}
    </Link>
  );
}

export function TaskSubtasksSection({
  task,
  onUpdated,
  compact = false,
}: {
  task: TaskItem;
  onUpdated?: () => void;
  compact?: boolean;
}) {
  const [children, setChildren] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.fetchChildTasks(task.code);
      setChildren(data.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载子任务失败");
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [task.code]);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  const doneCount = children.filter((c) => c.done).length;
  const parentDone = Boolean(task.done);
  const canAdd = !parentDone;

  async function addSubtask() {
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      await taskApi.createSubtask(task.code, name);
      setNewName("");
      setShowAdd(false);
      await loadChildren();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建子任务失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleChildDone(child: TaskItem) {
    if (child.parentDone && child.done) {
      setError("父任务已完成，无法重做子任务");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await taskApi.markTaskDone(child.code, child.done ? 0 : 1);
      await loadChildren();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新子任务失败");
    } finally {
      setSubmitting(false);
    }
  }

  function childPath(child: TaskItem): string {
    return buildTaskPath(
      taskToUrlInput({
        ...child,
        projectId: child.project_id ?? task.project_id,
        project_code: child.project_code ?? task.project_code,
      }),
    );
  }

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={compact ? "type-label text-subtle" : "type-heading-xsmall text-subtle"}>
          子任务
          {children.length ? (
            <span className="type-hint ml-1.5 font-normal">
              · {doneCount}/{children.length}
            </span>
          ) : null}
        </h2>
        {canAdd ? (
          <Button
            isDisabled={showAdd}
            size="sm"
            variant="tertiary"
            onPress={() => setShowAdd(true)}
          >
            添加子任务
          </Button>
        ) : (
          <span className="type-hint">父任务已完成，无法添加子任务</span>
        )}
      </div>

      {error ? (
        <p className="type-body rounded-md bg-danger/10 px-3 py-2 text-danger">{error}</p>
      ) : null}

      {loading && !children.length ? (
        <p className="type-hint py-2">加载中…</p>
      ) : null}

      {children.length ? (
        <ul className="divide-y divide-separator rounded-lg border border-separator">
          {children.map((child) => {
            const blocked =
              Boolean(child.parentDone) && Boolean(child.done);
            return (
              <li key={child.code} className="flex items-center gap-2 px-3 py-2">
                <button
                  aria-label={child.done ? "标记未完成" : "标记完成"}
                  className={clsx(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                    child.done
                      ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-brand)] text-white"
                      : "border-separator hover:border-[var(--ads-color-brand)]",
                    (blocked || submitting) && "cursor-not-allowed opacity-50",
                  )}
                  disabled={blocked || submitting}
                  type="button"
                  onClick={() => void toggleChildDone(child)}
                >
                  {child.done ? (
                    <svg aria-hidden fill="none" height="12" viewBox="0 0 12 12" width="12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                      />
                    </svg>
                  ) : null}
                </button>
                {child.executor ? (
                  <MemberAvatar
                    className="size-6 shrink-0"
                    name={child.executor.name}
                    src={child.executor.avatar}
                  />
                ) : (
                  <span className="size-6 shrink-0" />
                )}
                <Link
                  className={clsx(
                    "min-w-0 flex-1 truncate type-body hover:text-[var(--ads-color-link)] hover:underline",
                    child.done && "text-subtle line-through",
                  )}
                  to={childPath(child)}
                >
                  {child.name?.trim() || taskApi.taskDisplayTitle(child)}
                </Link>
                <span className="type-hint shrink-0 font-mono">
                  {taskDisplayKey(taskToUrlInput(child))}
                </span>
              </li>
            );
          })}
        </ul>
      ) : !loading ? (
        <p className="type-hint py-1">暂无子任务</p>
      ) : null}

      {showAdd && canAdd ? (
        <div className="flex flex-wrap gap-2">
          <InputGroup className="min-w-[12rem] flex-1">
            <InputGroup.Input
              autoFocus
              placeholder="子任务标题"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addSubtask();
                if (e.key === "Escape") {
                  setShowAdd(false);
                  setNewName("");
                }
              }}
            />
          </InputGroup>
          <Button isPending={submitting} size="sm" onPress={() => void addSubtask()}>
            创建
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              setShowAdd(false);
              setNewName("");
            }}
          >
            取消
          </Button>
        </div>
      ) : null}
    </section>
  );
}
