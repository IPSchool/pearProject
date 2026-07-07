import { useCallback, useEffect, useState } from "react";

import { fetchProject } from "@/api/project";
import { IssueKeySettings } from "@/components/project/issue-key-settings";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import type { ProjectDetail } from "@/types/api";

export default function ProjectSettingsPage() {
  const { apiCode, pathId } = useProjectRoute();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!apiCode) return;
    setLoading(true);
    try {
      setProject(await fetchProject(apiCode));
    } finally {
      setLoading(false);
    }
  }, [apiCode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && !project) {
    return <p className="type-meta py-8 text-center">加载中…</p>;
  }

  if (!project) {
    return <p className="type-meta py-8 text-center text-danger">无法加载项目</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        description="编号规则、链接格式等项目级配置。"
        size="medium"
        title="项目设置"
      />
      <IssueKeySettings
        apiCode={apiCode}
        pathId={pathId}
        project={project}
        onSaved={() => void reload()}
      />
    </div>
  );
}
