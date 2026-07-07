/** 里程碑状态（对齐 Legacy ProjectVersion.status） */
export const MILESTONE_STATUS = [
  { value: 0, label: "未开始", tone: "default" as const },
  { value: 1, label: "进行中", tone: "accent" as const },
  { value: 2, label: "已延期", tone: "warning" as const },
  { value: 3, label: "已完成", tone: "success" as const },
];

export function milestoneStatusLabel(status?: number, statusText?: string) {
  if (statusText) return statusText;
  return MILESTONE_STATUS.find((s) => s.value === status)?.label ?? "未开始";
}
