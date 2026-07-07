import { useLocation } from "react-router-dom";

import {
  isProjectViewActive,
  PRIMARY_PROJECT_VIEWS,
  SECONDARY_PROJECT_VIEWS,
} from "@/config/project-views";
import { useProjectContext, useProjectRoute } from "@/contexts/project-context";

/** 当前项目内视图，用于钉选到快捷入口 */
export function useCurrentProjectViewPin(): {
  label: string;
  href: string;
  subtitle?: string;
} | null {
  const { pathId } = useProjectRoute();
  const project = useProjectContext();
  const location = useLocation();
  const base = `/project/${pathId}`;
  const pathname = location.pathname;

  const allViews = [...PRIMARY_PROJECT_VIEWS, ...SECONDARY_PROJECT_VIEWS];
  for (const tab of allViews) {
    if (isProjectViewActive(tab, pathname, base)) {
      const projectName = project?.name ?? "项目";
      return {
        label: `${projectName} · ${tab.label}`,
        href: `${base}${tab.suffix}`,
        subtitle: tab.label,
      };
    }
  }

  return null;
}
