import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { setProjectCollect } from "@/api/collect";
import { AddToQuickAccessButton } from "@/components/add-to-quick-access-button";
import { MembersIcon } from "@/components/nav-icon";
import { ProjectGlyph, ProjectStarButton } from "@/components/project-star";
import { resolveProjectCoverUrl } from "@/config/assets";
import { useProjectContext, useProjectRoute } from "@/contexts/project-context";
import { useCurrentProjectViewPin } from "@/hooks/use-current-project-view-pin";
import { buildProjectPath } from "@/lib/issue-url";
import { useStarredProjectsStore } from "@/stores/starred-projects";

export function ProjectHeader() {
  const { pathId, apiCode } = useProjectRoute();
  const project = useProjectContext();
  const reloadStarred = useStarredProjectsStore((s) => s.load);
  const viewPin = useCurrentProjectViewPin();
  const [collected, setCollected] = useState(Boolean(project?.collected));

  useEffect(() => {
    setCollected(Boolean(project?.collected));
  }, [project?.collected, project?.code]);

  if (!project) return null;

  async function toggleStar() {
    if (!project) return;
    const next = !collected;
    await setProjectCollect(apiCode || project.code, next);
    setCollected(next);
    await reloadStarred();
  }

  return (
    <div className="flex items-center gap-3">
      <ProjectGlyph
        className="size-10 shrink-0"
        cover={resolveProjectCoverUrl(project.cover)}
        name={project.name}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="type-heading-medium truncate">{project.name}</h1>
          <ProjectStarButton collected={collected} size="sm" onPress={toggleStar} />
        </div>
        {project.description ? (
          <p className="type-hint truncate">{project.description}</p>
        ) : null}
      </div>
      <Link
        aria-label="成员"
        className="inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground"
        title="成员"
        to={buildProjectPath(pathId, "members")}
      >
        <MembersIcon className="size-[1.125rem]" />
      </Link>
      {viewPin ? (
        <AddToQuickAccessButton
          href={viewPin.href}
          kind="project_view"
          label={viewPin.label}
          subtitle={viewPin.subtitle}
          variant="icon"
        />
      ) : null}
    </div>
  );
}
