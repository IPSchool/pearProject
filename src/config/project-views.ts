import type { ComponentType, SVGProps } from "react";

import {
  ArchiveIcon,
  CalendarIcon,
  ChartIcon,
  FolderIcon,
  ListIcon,
  SettingsIcon,
  SummaryIcon,
  TaskIcon,
  TemplateIcon,
  UsersIcon,
  VersionIcon,
} from "@/components/nav-icon";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface ProjectViewTab {
  key: string;
  label: string;
  suffix: string;
  icon: Icon;
  /** 匹配任务详情等子路由时仍高亮该视图 */
  match?: (pathname: string, base: string) => boolean;
}

/** Jira 式主视图 Tab（顺序与 Jira 对齐） */
export const PRIMARY_PROJECT_VIEWS: ProjectViewTab[] = [
  { key: "overview", label: "摘要", suffix: "/overview", icon: SummaryIcon },
  { key: "list", label: "列表", suffix: "/list", icon: ListIcon },
  {
    key: "board",
    label: "看板",
    suffix: "/tasks",
    icon: TaskIcon,
    match: (pathname, base) => pathname.startsWith(`${base}/tasks`),
  },
  { key: "calendar", label: "日历", suffix: "/calendar", icon: CalendarIcon },
  { key: "timeline", label: "时间线", suffix: "/timeline", icon: ChartIcon },
  { key: "wiki", label: "文档", suffix: "/wiki", icon: TemplateIcon },
  { key: "forms", label: "表单", suffix: "/forms", icon: FolderIcon },
  { key: "backlog", label: "待办事项", suffix: "/backlog", icon: ArchiveIcon },
  { key: "versions", label: "版本", suffix: "/versions", icon: VersionIcon },
];

/** 次要视图（仍保留 Legacy 能力） */
export const SECONDARY_PROJECT_VIEWS: ProjectViewTab[] = [
  { key: "members", label: "成员", suffix: "/members", icon: UsersIcon },
  { key: "files", label: "文件", suffix: "/files", icon: FolderIcon },
  { key: "tags", label: "标签", suffix: "/tags", icon: TemplateIcon },
  { key: "workflow", label: "工作流", suffix: "/workflow", icon: SettingsIcon },
  { key: "settings", label: "设置", suffix: "/settings", icon: SettingsIcon },
];

export function isProjectViewActive(
  tab: ProjectViewTab,
  pathname: string,
  base: string,
): boolean {
  if (tab.match) return tab.match(pathname, base);
  const href = `${base}${tab.suffix}`;
  if (tab.key === "wiki") {
    return pathname.startsWith(`${base}/wiki`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
