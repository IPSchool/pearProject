import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Chip, Spinner } from "@heroui/react";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import * as taskApi from "@/api/task";
import type { TaskItem, TaskStage } from "@/types/api";

interface KanbanBoardProps {
  projectCode: string;
  onTaskClick: (task: TaskItem) => void;
  refreshKey?: number;
}

function TaskCardContent({ task }: { task: TaskItem }) {
  return (
    <>
      <p className="font-medium text-sm leading-snug">{task.name}</p>
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
    useSortable({ id: task.code, data: { task, stageCode: task.stage_code } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <Card
        className={clsx(
          "p-3 cursor-grab active:cursor-grabbing mb-2",
          isDragging && "opacity-50 shadow-lg",
        )}
      >
        <button
          className="w-full text-left"
          type="button"
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
}: {
  stage: TaskStage;
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.code,
    data: { stageCode: stage.code },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-w-72 flex-1 flex-col rounded-xl border border-separator bg-surface/30",
        isOver && "ring-2 ring-accent/40",
      )}
    >
      <div className="flex items-center justify-between border-b border-separator px-4 py-3">
        <p className="font-medium">{stage.name}</p>
        <Chip size="sm" variant="soft">
          {tasks.length}
        </Chip>
      </div>
      <div className="flex-1 overflow-y-auto p-3 min-h-48">
        <SortableContext items={tasks.map((t) => t.code)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.code} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ projectCode, onTaskClick, refreshKey = 0 }: KanbanBoardProps) {
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [tasksByStage, setTasksByStage] = useState<Record<string, TaskItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskCode = String(active.id);
    const fromStage = active.data.current?.stageCode as string | undefined;
    const toStage =
      (over.data.current?.stageCode as string | undefined) ??
      (stages.some((s) => s.code === over.id) ? String(over.id) : fromStage);

    if (!fromStage || !toStage || fromStage === toStage) return;

    try {
      await taskApi.sortTask(taskCode, toStage);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "移动失败");
    }
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
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={onDragEnd}
      onDragStart={(e) => {
        const task = e.active.data.current?.task as TaskItem | undefined;
        if (task) setActiveTask(task);
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.code}
            stage={stage}
            tasks={tasksByStage[stage.code] ?? []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card className="p-3 w-72 shadow-xl opacity-95">
            <TaskCardContent task={activeTask} />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
