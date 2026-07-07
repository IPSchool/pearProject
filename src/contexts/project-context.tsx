import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { fetchProject } from "@/api/project";
import { buildProjectPath, isNumericProjectRef } from "@/lib/issue-url";
import type { ProjectDetail } from "@/types/api";

const ProjectContext = createContext<ProjectDetail | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { code: projectRef = "" } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    if (!projectRef) {
      setProject(null);
      return;
    }
    fetchProject(projectRef)
      .then(setProject)
      .catch(() => setProject(null));
  }, [projectRef]);

  useEffect(() => {
    if (!project?.id || !projectRef) return;
    const canonical = String(project.id);
    if (projectRef === canonical) return;
    const prefix = `/project/${projectRef}`;
    if (!location.pathname.startsWith(prefix)) return;
    const rest = location.pathname.slice(prefix.length) || "/overview";
    navigate(`${buildProjectPath(project.id, rest.replace(/^\//, ""))}${location.search}`, {
      replace: true,
    });
  }, [project?.id, projectRef, location.pathname, location.search, navigate]);

  return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  return useContext(ProjectContext);
}

/** URL 段用数字 id；API 用内部 code */
export function useProjectRoute() {
  const { code: projectRef = "" } = useParams<{ code: string }>();
  const project = useProjectContext();

  const pathId = project?.id != null ? String(project.id) : projectRef;
  const apiCode =
    project?.code ?? (projectRef && !isNumericProjectRef(projectRef) ? projectRef : "");

  return {
    projectRef,
    project,
    pathId,
    apiCode,
    projectId: project?.id ?? (isNumericProjectRef(projectRef) ? Number(projectRef) : null),
  };
}
