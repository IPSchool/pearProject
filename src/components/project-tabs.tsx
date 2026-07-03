import { Link, useLocation, useParams } from "react-router-dom";

import { useProjectContext } from "@/contexts/project-context";
import clsx from "clsx";

const tabs = [
  { key: "overview", label: "概览", suffix: "/overview" },
  { key: "tasks", label: "看板", suffix: "/tasks" },
  { key: "members", label: "成员", suffix: "/members" },
  { key: "files", label: "文件", suffix: "/files" },
  { key: "tags", label: "标签", suffix: "/tags" },
  { key: "versions", label: "版本", suffix: "/versions" },
  { key: "workflow", label: "工作流", suffix: "/workflow" },
] as const;

export function ProjectTabs() {
  const { code = "" } = useParams<{ code: string }>();
  const location = useLocation();
  const base = `/project/${code}`;

  return (
    <div className="flex gap-1 border-b border-separator">
      {tabs.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const active = location.pathname.startsWith(href);
        return (
          <Link
            key={tab.key}
            className={clsx(
              "px-4 py-2 text-sm -mb-px border-b-2 transition-colors",
              active
                ? "border-accent text-accent font-medium"
                : "border-transparent text-muted hover:text-foreground",
            )}
            to={href}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function ProjectBreadcrumb({ title }: { title?: string }) {
  const { code = "" } = useParams<{ code: string }>();
  const project = useProjectContext();
  const display = project?.name ?? code;
  return (
    <div>
      <p className="text-sm text-muted">
        <Link className="hover:underline" to="/projects">
          项目
        </Link>
        {" / "}
        {display}
        {title ? ` / ${title}` : ""}
      </p>
    </div>
  );
}
