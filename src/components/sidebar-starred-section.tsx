import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

import { StarredProjectsFlyout } from "@/components/starred-projects-flyout";
import { ProjectGlyph } from "@/components/project-star";
import { ChevronRightIcon, StarIcon } from "@/components/nav-icon";
import { resolveProjectCoverUrl } from "@/config/assets";
import { useAuthStore } from "@/stores/auth";
import { useStarredProjectsStore } from "@/stores/starred-projects";
import type { ProjectSummary } from "@/types/api";

interface SidebarStarredSectionProps {
  collapsed: boolean;
  sidebarWidth: number;
}

const PREVIEW_LIMIT = 5;

export function SidebarStarredSection({ collapsed, sidebarWidth }: SidebarStarredSectionProps) {
  const orgCode = useAuthStore((s) => s.currentOrganization?.code);
  const projects = useStarredProjectsStore((s) => s.projects);
  const loading = useStarredProjectsStore((s) => s.loading);
  const load = useStarredProjectsStore((s) => s.load);
  const setCollected = useStarredProjectsStore((s) => s.setCollected);

  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load, orgCode]);

  const preview = projects.slice(0, PREVIEW_LIMIT);

  async function handleToggle(project: ProjectSummary) {
    await setCollected(project.code, false);
  }

  return (
    <>
      <div className={clsx("border-t border-separator", collapsed ? "px-2 py-2" : "px-3 py-3")}>
        <button
          className={clsx(
            "flex w-full items-center rounded-md type-body transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2",
            flyoutOpen
              ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)] font-medium"
              : "text-foreground hover:bg-[var(--ads-color-background-neutral)]",
          )}
          title={collapsed ? "已加星" : undefined}
          type="button"
          onClick={() => setFlyoutOpen((o) => !o)}
        >
          <StarIcon className="size-[1.125rem] shrink-0 opacity-80" />
          {!collapsed ? (
            <>
              <span className="flex-1 truncate text-left">已加星</span>
              <ChevronRightIcon className="size-4 shrink-0 opacity-60" />
            </>
          ) : null}
        </button>

        {!collapsed ? (
          <div className="mt-2 space-y-0.5">
            {loading && !projects.length ? (
              <p className="px-3 py-2 type-hint">加载中…</p>
            ) : null}
            {preview.map((project) => (
              <Link
                key={project.code}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 type-body hover:bg-[var(--ads-color-background-neutral)]"
                to={`/project/${project.id ?? project.code}/overview`}
              >
                <ProjectGlyph
                  className="size-6 shrink-0"
                  cover={resolveProjectCoverUrl(project.cover)}
                  name={project.name}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
            {!loading && !projects.length ? (
              <p className="px-3 py-1 type-hint">收藏项目后会显示在这里</p>
            ) : null}
            {projects.length > PREVIEW_LIMIT ? (
              <button
                className="w-full rounded-md px-3 py-1.5 text-left type-hint hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground"
                type="button"
                onClick={() => setFlyoutOpen(true)}
              >
                更多已加星项目…
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {flyoutOpen ? (
        <StarredProjectsFlyout
          anchorLeft={sidebarWidth}
          projects={projects}
          onClose={() => setFlyoutOpen(false)}
          onToggleCollect={handleToggle}
        />
      ) : null}
    </>
  );
}
