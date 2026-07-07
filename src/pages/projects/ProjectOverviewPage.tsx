import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import { editProject, fetchProject } from "@/api/project";
import * as projectInfoApi from "@/api/projectInfo";
import { fetchProjectOverview, fetchProjectTaskStats } from "@/api/projectStats";
import type { ProjectOverviewWidgets, ProjectTaskStats } from "@/api/projectStats";
import { MarkdownContent } from "@/components/markdown-content";
import { OverviewCanvas } from "@/components/project/overview-canvas";
import {
  ProjectIntroEditModal,
  ProjectOverviewCover,
} from "@/components/project/project-intro-edit-modal";
import { ProjectOverviewWidgetsPanel } from "@/components/project/overview-widgets";
import { PageHeader } from "@/components/typography";
import { useProjectContext, useProjectRoute } from "@/contexts/project-context";
import { filterOverviewCanvasBlocks } from "@/lib/overview-canvas";
import {
  DEFAULT_OVERVIEW_SETTINGS,
  parseOverviewSettings,
  type OverviewSettings,
} from "@/lib/overview-settings";
import type { ProjectDetail, ProjectInfoBlock } from "@/types/api";

export default function ProjectOverviewPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const ctxProject = useProjectContext();
  const [project, setProject] = useState<ProjectDetail | null>(ctxProject);
  const [allInfoBlocks, setAllInfoBlocks] = useState<ProjectInfoBlock[]>([]);
  const [blocks, setBlocks] = useState<ProjectInfoBlock[]>([]);
  const [overviewSettings, setOverviewSettings] = useState<OverviewSettings>(
    DEFAULT_OVERVIEW_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [introOpen, setIntroOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ProjectTaskStats | null>(null);
  const [widgets, setWidgets] = useState<ProjectOverviewWidgets | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, list, s, w] = await Promise.all([
        fetchProject(projectCode),
        projectInfoApi.fetchProjectInfoBlocks(projectCode),
        fetchProjectTaskStats(projectCode).catch(() => null),
        fetchProjectOverview(projectCode).catch(() => null),
      ]);
      setProject(p);
      setProjectName(p.name);
      setAllInfoBlocks(list);
      setOverviewSettings(parseOverviewSettings(list));
      setStats(s);
      setWidgets(w);
      setBlocks(filterOverviewCanvasBlocks(list));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveRename() {
    if (!projectName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await editProject(projectCode, projectName.trim(), project?.description ?? "");
      setRenameOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader size="medium" title="摘要" />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <ProjectOverviewCover project={project} showCover={overviewSettings.showCover} />

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-heading-large">{project?.name}</p>
            {project?.description ? (
              <div className="type-meta mt-3">
                <MarkdownContent source={project.description} />
              </div>
            ) : (
              <p className="type-meta mt-2 text-subtle">暂无项目介绍，点击「编辑介绍」添加描述。</p>
            )}
            <div className="type-hint mt-3 flex flex-wrap gap-4">
              {project?.owner_name ? <span>负责人：{project.owner_name}</span> : null}
              {project?.create_time ? <span>创建于 {project.create_time}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => project && setIntroOpen(true)}
            >
              编辑介绍
            </Button>
            <button
              className="type-hint text-[var(--ads-color-link)] hover:underline"
              type="button"
              onClick={() => setRenameOpen(true)}
            >
              重命名项目
            </button>
          </div>
        </div>
      </Card>

      <OverviewCanvas blocks={blocks} projectCode={projectCode} onChanged={load} />

      <ProjectOverviewWidgetsPanel
        projectCode={projectCode}
        stats={stats}
        widgets={widgets}
      />

      {project ? (
        <ProjectIntroEditModal
          infoBlocks={allInfoBlocks}
          open={introOpen}
          project={project}
          projectCode={projectCode}
          onOpenChange={setIntroOpen}
          onSaved={load}
        />
      ) : null}

      <Modal.Backdrop isOpen={renameOpen} onOpenChange={setRenameOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>重命名项目</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField isRequired name="projectName">
                <Label>项目名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    autoFocus
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setRenameOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={() => void handleSaveRename()}>
                保存
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
