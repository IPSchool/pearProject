import { Outlet } from "react-router-dom";

import { ProjectBreadcrumb, ProjectTabs } from "@/components/project-tabs";
import { ProjectProvider } from "@/contexts/project-context";

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <div className="space-y-4">
        <ProjectBreadcrumb />
        <ProjectTabs />
        <Outlet />
      </div>
    </ProjectProvider>
  );
}
