import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Chip, Spinner } from "@heroui/react";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import * as taskApi from "@/api/task";
import type { TaskItem, TaskStage } from "@/types/api";

interface KanbanBoardProps {
  projectCode: string;
  onTaskClick: (task: TaskItem) => void;
  refreshKey?: number;
}

type TasksByStage = Record<string, TaskItem[]>;

function columnDroppableId(stageCode: string) {
  return `column:${stageCode}`;
}

function parseColumnId(id: string | number): string | null {
  const s = String(id);
  return s.startsWith("column:") ? s.slice(7) : null;
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

function TaskCardContent({ task }: { task: TaskItem }) {
  return (
    <>
      <p className="type-body font-medium leading-snug">{task.name}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {task.priText ? (
          <Chip size="sm" variant="soft">
            {task.priText}
          </Chip>
        ) : null}
        {task.done ? (
          <Chip color="success" size="sm" variant="soft">
            已完成
          </Chip>
        ) : null}
      </div>
    </>
  );
}

function SortableTaskCard({
  task,
  onClick,
}: {
  task: TaskItem;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.code,
      data: { type: "task", task, stageCode: task.stage_code },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="mb-2"
      {...attributes}
      {...listeners}
    >
      <Card
        className={clsx(
          "p-3 cursor-grab active:cursor-grabbing touch-none",
          isDragging && "ring-2 ring-accent/30",
        )}
      >
        <button
          className="w-full text-left pointer-events-auto"
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClick}
        >
          <TaskCardContent task={task} />
        </button>
      </Card>
    </div>
  );
}

function KanbanColumn({
  stage,
  tasks,
  onTaskClick,
  isDropTarget,
}: {
  stage: TaskStage;
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  isDropTarget: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(stage.code),
    data: { type: "column", stageCode: stage.code },
  });

  const highlighted = isOver || isDropTarget;
  const isEmpty = tasks.length === 0;

  return (
    <div
      className={clsx(
        "flex min-w-72 max-w-80 flex-1 flex-col rounded-lg border bg-surface-sunken transition-all duration-150",
        highlighted
          ? "border-accent bg-accent/5 shadow-[inset_0_0_0_2px_hsl(var(--accent)/0.45)]"
          : "border-separator",
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between border-b px-4 py-3 transition-colors",
          highlighted ? "border-accent/30 bg-accent/10" : "border-separator",
        )}
      >
        <p className={clsx("type-heading-xsmall", highlighted && "text-[var(--ads-color-text-selected)]")}>
          {stage.name}
        </p>
        <Chip color={highlighted ? "accent" : undefined} size="sm" variant="soft">
          {tasks.length}
        </Chip>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "relative flex-1 overflow-y-auto p-3 min-h-56 transition-colors",
          highlighted && "bg-accent/[0.03]",
        )}
      >
        <SortableContext items={tasks.map((t) => t.code)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.code} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {isEmpty ? (
          <div
            className={clsx(
              "flex min-h-40 items-center justify-center rounded-md border-2 border-dashed type-body transition-all",
              highlighted
                ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)] font-medium"
                : "border-separator text-subtlest",
            )}
          >
            {highlighted ? "松手放入此列" : "将任务拖入此列"}
          </div>
        ) : highlighted ? (
          <div className="mt-2 rounded-lg border-2 border-dashed border-accent/50 bg-accent/5 py-3 text-center text-xs text-accent">
            松手放入此列
          </div>
        ) : null}
      </div>
    </div>
  );
}

function findStageForTask(tasksByStage: TasksByStage, taskCode: string): string | null {
  for (const [stageCode, tasks] of Object.entries(tasksByStage)) {
    if (tasks.some((t) => t.code === taskCode)) return stageCode;
  }
  return null;
}

function resolveOverStage(
  overId: string | number,
  overData: { type?: string; stageCode?: string } | undefined,
  tasksByStage: TasksByStage,
  stages: TaskStage[],
): string | null {
  const col = parseColumnId(overId);
  if (col) return col;

  const data = overData as { type?: string; stageCode?: string } | undefined;
  if (data?.type === "column" && data.stageCode) return data.stageCode;
  if (data?.stageCode) return data.stageCode;

  if (stages.some((s) => s.code === String(overId))) return String(overId);

  return findStageForTask(tasksByStage, String(overId));
}

export function KanbanBoard({ projectCode, onTaskClick, refreshKey = 0 }: KanbanBoardProps) {
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [tasksByStage, setTasksByStage] = useState<TasksByStage>({});
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [dragOriginStage, setDragOriginStage] = useState<string | null>(null);
  const [overStageCode, setOverStageCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stageList = await taskApi.fetchTaskStages(projectCode);
      setStages(stageList);
      const entries = await Promise.all(
        stageList.map(async (s) => {
          const tasks = await taskApi.fetchStageTasks(s.code);
          return [s.code, tasks.map((t) => ({ ...t, stage_code: s.code }))] as const;
        }),
      );
      setTasksByStage(Object.fromEntries(entries));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载看板失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const dropTargetStage = useMemo(() => {
    if (!activeTask || !overStageCode || overStageCode === dragOriginStage) return null;
    return overStageCode;
  }, [activeTask, overStageCode, dragOriginStage]);

  function onDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskItem | undefined;
    const stageCode =
      (event.active.data.current?.stageCode as string | undefined) ??
      (task ? findStageForTask(tasksByStage, task.code) : null);
    if (task) {
      setActiveTask(task);
      setDragOriginStage(stageCode);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverStageCode(null);
      return;
    }

    const targetStage = resolveOverStage(
      over.id,
      over.data.current as { type?: string; stageCode?: string } | undefined,
      tasksByStage,
      stages,
    );
    setOverStageCode(targetStage);

    const activeId = String(active.id);
    const fromStage = findStageForTask(tasksByStage, activeId);
    if (!fromStage || !targetStage || fromStage === targetStage) return;

    setTasksByStage((prev) => {
      const fromTasks = [...(prev[fromStage] ?? [])];
      const toTasks = [...(prev[targetStage] ?? [])];
      const activeIndex = fromTasks.findIndex((t) => t.code === activeId);
      if (activeIndex === -1) return prev;

      const [moved] = fromTasks.splice(activeIndex, 1);
      const overId = String(over.id);
      const overIndex = toTasks.findIndex((t) => t.code === overId);
      const insertAt = overIndex >= 0 ? overIndex : toTasks.length;
      toTasks.splice(insertAt, 0, { ...moved, stage_code: targetStage });

      return {
        ...prev,
        [fromStage]: fromTasks,
        [targetStage]: toTasks,
      };
    });
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const taskCode = String(active.id);
    const originStage =
      dragOriginStage ??
      (active.data.current?.stageCode as string | undefined) ??
      findStageForTask(tasksByStage, taskCode);

    setActiveTask(null);
    setOverStageCode(null);
    setDragOriginStage(null);

    if (!over || !originStage) {
      await load();
      return;
    }

    const toStage = resolveOverStage(
      over.id,
      over.data.current as { type?: string; stageCode?: string } | undefined,
      tasksByStage,
      stages,
    );

    if (!toStage) {
      await load();
      return;
    }

    const columnTasks = tasksByStage[toStage] ?? [];
    const overId = String(over.id);
    const overIsTask = columnTasks.some((t) => t.code === overId);
    const nextTaskCode =
      overIsTask && overId !== taskCode ? overId : "";

    try {
      if (originStage !== toStage || (overIsTask && overId !== taskCode)) {
        await taskApi.sortTask(taskCode, toStage, nextTaskCode);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "移动失败");
      await load();
    }
  }

  function onDragCancel() {
    setActiveTask(null);
    setDragOriginStage(null);
    setOverStageCode(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Card className="p-4 text-danger">{error}</Card>;
  }

  return (
    <DndContext
      collisionDetection={collisionDetection}
      sensors={sensors}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.code}
            isDropTarget={dropTargetStage === stage.code}
            stage={stage}
            tasks={tasksByStage[stage.code] ?? []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? (
          <Card className="p-3 w-72 shadow-2xl ring-2 ring-accent rotate-1 scale-[1.02] cursor-grabbing">
            <TaskCardContent task={activeTask} />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
