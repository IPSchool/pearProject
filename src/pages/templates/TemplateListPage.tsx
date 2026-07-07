import { useEffect, useState } from "react";
import { Button, Card, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";

import * as templateApi from "@/api/template";
import * as stagesTplApi from "@/api/taskStagesTemplate";
import { ProjectCoverImage } from "@/components/project-cover-image";
import { PageHeader } from "@/components/typography";
import type { ProjectTemplate } from "@/api/template";
import type { TaskStagesTemplate } from "@/types/api";

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [stageTemplates, setStageTemplates] = useState<TaskStagesTemplate[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const proj = await templateApi.fetchTemplates(1, 50);
      const list = proj.list ?? [];
      setTemplates(list);
      if (list.length) {
        setSelectedTpl(list[0].code);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedTpl) {
      setStageTemplates([]);
      return;
    }
    setStagesLoading(true);
    stagesTplApi
      .fetchTaskStagesTemplates(selectedTpl)
      .then((data) => setStageTemplates(data.list ?? []))
      .catch(() => setStageTemplates([]))
      .finally(() => setStagesLoading(false));
  }, [selectedTpl]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await templateApi.createTemplate(name.trim(), desc);
      setOpen(false);
      setName("");
      setDesc("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={<Button onPress={() => setOpen(true)}>新建模板</Button>}
        description="从模板快速创建项目（Legacy projectTemplate）"
        title="项目模板"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card
              key={t.code}
              className={`overflow-hidden cursor-pointer ${selectedTpl === t.code ? "ring-2 ring-accent" : ""}`}
              onClick={() => setSelectedTpl(t.code)}
            >
              <ProjectCoverImage cover={t.cover} />
              <div className="p-4">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{t.description}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-medium">看板列模板</h3>
        <p className="text-sm text-muted">选中项目模板后展示其默认看板列（taskStagesTemplate）</p>
        {stagesLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stageTemplates.map((t) => (
              <Card key={t.code} className="p-4">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted mt-1">{t.description || "—"}</p>
              </Card>
            ))}
            {!stageTemplates.length && !stagesLoading ? (
              <Card className="p-6 text-center text-muted col-span-full">
                {selectedTpl ? "该模板暂无看板列" : "请先创建项目模板"}
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>新建模板</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="name">
                <Label>模板名称</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="desc">
                <Label>描述</Label>
                <InputGroup>
                  <InputGroup.Input value={desc} onChange={(e) => setDesc(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={handleCreate}>创建</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
