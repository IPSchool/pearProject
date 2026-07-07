import type { ReactNode, SVGProps } from "react";

import { SearchIcon } from "@/components/icons";

type NavIconProps = SVGProps<SVGSVGElement> & {
  href: string;
  label?: string;
};

const iconBase = {
  "aria-hidden": true as const,
  fill: "none" as const,
  focusable: false as const,
  height: "1.125rem",
  role: "presentation" as const,
  viewBox: "0 0 24 24",
  width: "1.125rem",
};

function strokeIcon(paths: ReactNode, props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props}>
      {paths}
    </svg>
  );
}

const S = {
  cap: "round" as const,
  join: "round" as const,
  w: 1.75,
};

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeLinejoin={S.join}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeLinejoin={S.join}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function TaskIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M9 11l2 2 4-4M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7ZM4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M10 11h4"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M7 3v2M17 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M6 20V10M12 20V4M18 20v-7"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function SummaryIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={S.w} />
      <path
        d="M12 8v4l2.5 2.5"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function VersionIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M4 18h16M6 14h12M8 10h8M10 6h4"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function TemplateIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M4 5a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5ZM8 13h8M8 17h5"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19a3 3 0 0 0-2-2.83M4 19a3 3 0 0 1 2-2.83"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M15 17H9l-1 2h8l-1-2ZM18 13a6 6 0 1 0-12 0c0 2.5-1 3-1 5h14c0-2-1-2.5-1-5Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M12 3.5 14.6 9l5.9.5-4.5 3.8 1.4 5.7L12 16.8 6.6 19l1.4-5.7L3.5 9.5 9.4 9 12 3.5Z"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeLinejoin={S.join}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function StarFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props}>
      <path
        d="M12 2.5 15.1 9.5 22.5 10.4 17 15.2 18.5 22.5 12 18.8 5.5 22.5 7 15.2 1.5 10.4 8.9 9.5 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="m9 6 6 6-6 6"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeLinejoin={S.join}
      strokeWidth={S.w}
    />,
    props,
  );
}

/** 侧栏收起/展开（Jira 式面板图标） */
export function SidebarPanelIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <rect
        height="16"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={S.w}
        width="16"
        x="4"
        y="4"
      />
      <path
        d="M9 4v16"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function MaximizeIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function MinimizeIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M9 5H5v4M19 9V5h-4M15 19h4v-4M5 15v4h4"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeLinecap={S.cap}
      strokeWidth={S.w}
    />,
    props,
  );
}

export function MembersIcon(props: SVGProps<SVGSVGElement>) {
  return UsersIcon(props);
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M10 17 15 12 10 7M15 12H4M8 21H17a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return strokeIcon(
    <>
      <path
        d="M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z"
        stroke="currentColor"
        strokeLinecap={S.cap}
        strokeLinejoin={S.join}
        strokeWidth={S.w}
      />
    </>,
    props,
  );
}

const HREF_ICONS: Array<{ match: (href: string) => boolean; Icon: typeof HomeIcon }> = [
  { match: (h) => h.startsWith("/workbench"), Icon: HomeIcon },
  { match: (h) => h.startsWith("/projects") || h.startsWith("/project/"), Icon: FolderIcon },
  { match: (h) => h.startsWith("/my-tasks") || h.startsWith("/browse/"), Icon: TaskIcon },
  { match: (h) => h.startsWith("/search"), Icon: SearchIcon },
  { match: (h) => h.startsWith("/recycle"), Icon: TrashIcon },
  { match: (h) => h.startsWith("/archive"), Icon: ArchiveIcon },
  { match: (h) => h.startsWith("/events"), Icon: CalendarIcon },
  { match: (h) => h.startsWith("/analytics"), Icon: ChartIcon },
  { match: (h) => h.startsWith("/templates"), Icon: TemplateIcon },
  { match: (h) => h.startsWith("/team"), Icon: UsersIcon },
  { match: (h) => h.startsWith("/admin"), Icon: SettingsIcon },
  { match: (h) => h.startsWith("/notifications"), Icon: BellIcon },
  { match: (h) => h.startsWith("/settings"), Icon: SettingsIcon },
];

function iconFromLabel(label?: string) {
  if (!label) return GridIcon;
  if (label.includes("工作台") || label.includes("首页")) return HomeIcon;
  if (label.includes("项目")) return FolderIcon;
  if (label.includes("任务")) return TaskIcon;
  if (label.includes("搜索")) return SearchIcon;
  if (label.includes("回收")) return TrashIcon;
  if (label.includes("归档")) return ArchiveIcon;
  if (label.includes("日程")) return CalendarIcon;
  if (label.includes("分析")) return ChartIcon;
  if (label.includes("模板")) return TemplateIcon;
  if (label.includes("团队") || label.includes("成员")) return UsersIcon;
  if (label.includes("通知")) return BellIcon;
  if (label.includes("设置")) return SettingsIcon;
  return GridIcon;
}

export function NavIcon({ href, label, ...props }: NavIconProps) {
  const entry = HREF_ICONS.find(({ match }) => match(href));
  const Icon = entry?.Icon ?? iconFromLabel(label);
  return <Icon {...props} />;
}
