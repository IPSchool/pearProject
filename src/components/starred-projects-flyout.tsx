import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ProjectGlyph, ProjectStarButton } from "@/components/project-star";
import { SearchIcon } from "@/components/icons";
import { StarIcon } from "@/components/nav-icon";
import { resolveProjectCoverUrl } from "@/config/assets";
import type { ProjectSummary } from "@/types/api";

interface StarredProjectsFlyoutProps {
  projects: ProjectSummary[];
  anchorLeft: number;
  onClose: () => void;
  onToggleCollect: (project: ProjectSummary) => void;
}

export function StarredProjectsFlyout({
  projects,
  anchorLeft,
  onClose,
  onToggleCollect,
}: StarredProjectsFlyoutProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [projects, query]);

  return (
    <>
      <button
        aria-label="关闭"
        className="fixed inset-0 z-40 bg-transparent"
        type="button"
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex max-h-[min(32rem,calc(100vh-4rem))] w-[22rem] flex-col overflow-hidden rounded-lg border border-separator bg-surface shadow-xl"
        style={{ left: anchorLeft + 8, top: "3.5rem" }}
      >
        <div className="flex items-center justify-between border-b border-separator px-4 py-3">
          <h2 className="type-heading-xsmall">已加星</h2>
          <button
            aria-label="关闭面板"
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-[var(--ads-color-background-neutral)]"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="border-b border-separator px-3 py-2">
          <label className="flex items-center gap-2 rounded-md border border-separator bg-surface px-3 py-2">
            <SearchIcon className="text-subtlest" />
            <input
              className="min-w-0 flex-1 bg-transparent type-body outline-none placeholder:text-subtlest"
              placeholder="搜索已加星项目"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length ? (
            <ul className="space-y-0.5">
              {filtered.map((project) => (
                <li key={project.code}>
                  <div className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-[var(--ads-color-background-neutral)]">
                    <Link
                      className="flex min-w-0 flex-1 items-center gap-3"
                      to={`/project/${project.id ?? project.code}/overview`}
                      onClick={onClose}
                    >
                      <ProjectGlyph
                        className="size-8 shrink-0"
                        cover={resolveProjectCoverUrl(project.cover)}
                        name={project.name}
                      />
                      <span className="type-body truncate">{project.name}</span>
                    </Link>
                    <ProjectStarButton
                      collected
                      size="sm"
                      onPress={() => onToggleCollect(project)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-8 text-center type-meta">
              {query.trim() ? "无匹配项目" : "暂无已加星项目"}
            </p>
          )}
        </div>

        <div className="border-t border-separator p-2">
          <Link
            className="flex items-center gap-2 rounded-md px-3 py-2 type-body text-[var(--ads-color-link)] hover:bg-[var(--ads-color-background-neutral)]"
            to="/projects?view=starred"
            onClick={onClose}
          >
            <StarIcon className="size-4 opacity-70" />
            查看所有已加星项目
          </Link>
        </div>
      </div>
    </>
  );
}
