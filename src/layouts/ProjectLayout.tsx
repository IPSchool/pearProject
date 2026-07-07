import { Outlet } from "react-router-dom";

import { ProjectBreadcrumb, ProjectTabs } from "@/components/project-tabs";
import { ProjectHeader } from "@/components/project-header";
import { ProjectProvider } from "@/contexts/project-context";

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <div className="space-y-3">
        <ProjectBreadcrumb />
        <ProjectHeader />
        <ProjectTabs />
        <Outlet />
      </div>
    </ProjectProvider>
  );
}
