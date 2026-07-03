import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import { fetchProject } from "@/api/project";
import type { ProjectDetail } from "@/types/api";

const ProjectContext = createContext<ProjectDetail | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { code = "" } = useParams<{ code: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    if (!code) {
      setProject(null);
      return;
    }
    fetchProject(code)
      .then(setProject)
      .catch(() => setProject(null));
  }, [code]);

  return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
