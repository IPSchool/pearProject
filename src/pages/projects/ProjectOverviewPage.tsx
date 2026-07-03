import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import type { ProjectInfoBlock } from "@/types/api";
import { useProjectContext } from "@/contexts/project-context";
import type { ProjectDetail } from "@/types/api";

export default function ProjectOverviewPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const ctxProject = useProjectContext();
  const [project, setProject] = useState<ProjectDetail | null>(ctxProject);
  const [blocks, setBlocks] = useState<ProjectInfoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [desc, setDesc] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, list] = await Promise.all([
        fetchProject(projectCode),
        projectInfoApi.fetchProjectInfoBlocks(projectCode),
      ]);
      setProject(p);
      setProjectName(p.name);
      setProjectDesc(p.description ?? "");
      setBlocks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateBlock() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await projectInfoApi.createProjectInfoBlock(projectCode, name.trim(), value, desc);
      setOpen(false);
      setName("");
      setValue("");
      setDesc("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProject() {
    setSaving(true);
    try {
      await editProject(projectCode, projectName.trim(), projectDesc);
      setEditOpen(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">项目概览</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => setEditOpen(true)}>
            编辑项目
          </Button>
          <Button onPress={() => setOpen(true)}>新建信息块</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card className="p-5">
        <p className="text-2xl font-semibold">{project?.name}</p>
        <p className="text-sm text-muted mt-2">{project?.description || "暂无描述"}</p>
        <div className="flex gap-4 mt-3 text-xs text-muted">
          {project?.owner_name ? <span>负责人：{project.owner_name}</span> : null}
          {project?.create_time ? <span>创建于 {project.create_time}</span> : null}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {blocks.map((b) => (
          <Card key={b.code} className="p-4">
            <p className="font-medium">{b.name}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{b.value || b.description || "—"}</p>
          </Card>
        ))}
        {!blocks.length ? (
          <Card className="p-8 col-span-full text-center text-muted">暂无自定义信息块（HV-A87）</Card>
        ) : null}
      </div>

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>新建信息块</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-3">
              <TextField isRequired name="name">
                <Label>名称</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="value">
                <Label>内容</Label>
                <InputGroup>
                  <InputGroup.Input value={value} onChange={(e) => setValue(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={handleCreateBlock}>创建</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={editOpen} onOpenChange={setEditOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>编辑项目</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-3">
              <TextField isRequired name="projectName">
                <Label>项目名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
              <TextField name="projectDesc">
                <Label>描述</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setEditOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={handleSaveProject}>保存</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
