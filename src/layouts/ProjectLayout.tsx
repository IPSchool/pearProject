import { Outlet } from "react-router-dom";

import { ProjectBreadcrumb, ProjectTabs } from "@/components/project-tabs";

export default function ProjectLayout() {
  return (
    <div className="space-y-4">
      <ProjectBreadcrumb />
      <ProjectTabs />
      <Outlet />
    </div>
  );
}
