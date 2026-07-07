import { useEffect, useRef, useState } from "react";
import { Button, Label, Modal } from "@heroui/react";

import { editProjectFields, uploadProjectCover } from "@/api/project";
import * as projectInfoApi from "@/api/projectInfo";
import { MarkdownEditor } from "@/components/markdown-editor";
import { ProjectCoverImage } from "@/components/project-cover-image";
import {
  DEFAULT_OVERVIEW_SETTINGS,
  parseOverviewSettings,
  saveOverviewSettings,
  type OverviewSettings,
} from "@/lib/overview-settings";
import type { ProjectDetail, ProjectInfoBlock } from "@/types/api";

interface ProjectIntroEditModalProps {
  open: boolean;
  project: ProjectDetail;
  projectCode: string;
  infoBlocks: ProjectInfoBlock[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}

export function ProjectIntroEditModal({
  open,
  project,
  projectCode,
  infoBlocks,
  onOpenChange,
  onSaved,
}: ProjectIntroEditModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(project.description ?? "");
  const [coverUrl, setCoverUrl] = useState(project.cover ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewSettings>(DEFAULT_OVERVIEW_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescription(project.description ?? "");
    setCoverUrl(project.cover ?? "");
    setCoverFile(null);
    setCoverPreview(null);
    setOverview(parseOverviewSettings(infoBlocks));
    setError(null);
  }, [open, project, infoBlocks]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let nextCover = coverUrl;
      if (coverFile) {
        const uploaded = await uploadProjectCover(coverFile);
        nextCover = uploaded.url;
      }

      await editProjectFields(projectCode, {
        name: project.name,
        description,
        cover: nextCover,
      });
      await saveOverviewSettings(projectCode, infoBlocks, overview, projectInfoApi);
      onOpenChange(false);
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const displayCover = coverPreview ?? coverUrl ?? project.cover;

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-w-4xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>编辑项目介绍</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-5">
            <div>
              <Label>项目封面</Label>
              <div className="mt-2 flex flex-wrap items-start gap-4">
                <div className="overflow-hidden rounded-lg border border-separator">
                  <ProjectCoverImage
                    alt="封面预览"
                    className="h-24 w-40 object-cover"
                    cover={displayCover}
                  />
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                  <Button size="sm" variant="secondary" onPress={() => fileRef.current?.click()}>
                    更换封面
                  </Button>
                  {coverFile ? (
                    <p className="type-hint text-subtle">{coverFile.name}</p>
                  ) : null}
                </div>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  checked={overview.showCover}
                  className="size-4 accent-[var(--ads-color-brand)]"
                  type="checkbox"
                  onChange={(e) =>
                    setOverview((s) => ({ ...s, showCover: e.target.checked }))
                  }
                />
                <span className="type-body">在摘要页显示封面横幅</span>
              </label>
              {!overview.showCover ? (
                <p className="type-hint mt-1 text-subtlest">
                  关闭后摘要页顶部不再显示封面图，封面仍可用于项目列表等位置。
                </p>
              ) : null}
            </div>

            <div>
              <Label>项目介绍（Markdown）</Label>
              <p className="type-hint mb-2 text-subtlest">
                GitHub 风格编辑器：写入 / 预览切换，工具栏支持标题、粗体、列表与缩进等。
              </p>
              <MarkdownEditor
                minHeight="14rem"
                placeholder="- 项目目标&#10;- 里程碑&#10;&#10;支持 **Markdown** 与 emoji 📝"
                value={description}
                onChange={setDescription}
              />
            </div>

            {error ? <p className="type-body text-danger">{error}</p> : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              取消
            </Button>
            <Button isPending={saving} onPress={() => void handleSave()}>
              保存
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** 摘要页封面区（受 overview 设置控制） */
export function ProjectOverviewCover({
  project,
  showCover,
}: {
  project: ProjectDetail | null;
  showCover: boolean;
}) {
  if (!showCover || !project) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-separator">
      <ProjectCoverImage
        alt={project.name ?? "项目封面"}
        className="h-40 w-full object-cover md:h-52"
        cover={project.cover}
      />
    </div>
  );
}
