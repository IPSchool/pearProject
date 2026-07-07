import { Chip } from "@heroui/react";
import clsx from "clsx";

import type { TaskItem } from "@/types/api";

export function TaskStatusChip({ task, className }: { task: TaskItem; className?: string }) {
  const done = Boolean(task.done);
  const label = done ? "已完成" : (task.statusText ?? "进行中");
  return (
    <Chip
      className={clsx(className)}
      color={done ? "success" : "accent"}
      size="sm"
      variant="soft"
    >
      {label}
    </Chip>
  );
}
