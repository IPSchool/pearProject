import { useEffect, useState } from "react";
import { Button, Card, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";

import * as templateApi from "@/api/template";
import type { ProjectTemplate } from "@/api/template";

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await templateApi.fetchTemplates(1, 50);
      setTemplates(data.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">项目模板</h2>
          <p className="text-muted text-sm mt-1">从模板快速创建项目（Legacy projectTemplate）</p>
        </div>
        <Button onPress={() => setOpen(true)}>新建模板</Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.code} className="overflow-hidden">
              {t.cover ? (
                <img alt="" className="h-28 w-full object-cover" src={t.cover} />
              ) : (
                <div className="h-28 bg-accent/10" />
              )}
              <div className="p-4">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{t.description}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

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
