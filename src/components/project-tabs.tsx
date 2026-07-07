import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

import {
  isProjectViewActive,
  PRIMARY_PROJECT_VIEWS,
  SECONDARY_PROJECT_VIEWS,
} from "@/config/project-views";
import { useProjectContext, useProjectRoute } from "@/contexts/project-context";

export function ProjectTabs() {
  const { pathId } = useProjectRoute();
  const location = useLocation();
  const base = `/project/${pathId}`;
  const pathname = location.pathname;

  return (
    <div className="border-b border-separator">
      <div className="flex items-center gap-1 overflow-x-auto pb-px">
        {PRIMARY_PROJECT_VIEWS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active = isProjectViewActive(tab, pathname, base);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              className={clsx(
                "flex shrink-0 items-center justify-center px-2.5 py-2.5 type-body -mb-px border-b-2 transition-colors sm:gap-1.5 sm:px-3",
                active
                  ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
              title={tab.label}
              to={href}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-separator" />
        {SECONDARY_PROJECT_VIEWS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active = isProjectViewActive(tab, pathname, base);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              className={clsx(
                "flex shrink-0 items-center justify-center px-2 py-2 type-body-small -mb-px border-b-2 transition-colors sm:gap-1.5 sm:px-3",
                active
                  ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                  : "border-transparent text-subtlest hover:text-foreground",
              )}
              title={tab.label}
              to={href}
            >
              <Icon className="size-3.5 shrink-0 opacity-70" />
              <span className="hidden md:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectBreadcrumb({ title }: { title?: string }) {
  const project = useProjectContext();
  const { pathId } = useProjectRoute();
  const display = project?.name ?? pathId;
  return (
    <div>
      <p className="type-meta">
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
