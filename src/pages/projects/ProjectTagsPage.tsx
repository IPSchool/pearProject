import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Chip, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";

import * as taskTagApi from "@/api/taskTag";
import { PageHeader } from "@/components/typography";
import type { TaskTagItem } from "@/types/api";

export default function ProjectTagsPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [tags, setTags] = useState<TaskTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTags(await taskTagApi.fetchTaskTags(projectCode));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await taskTagApi.createTaskTag(projectCode, name.trim());
      setOpen(false);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
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
      <PageHeader
        actions={<Button onPress={() => setOpen(true)}>新建标签</Button>}
        size="medium"
        title="任务标签"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Chip key={t.code} size="lg" variant="soft">
            {t.name}
          </Chip>
        ))}
        {!tags.length ? <Card className="p-8 w-full text-center text-muted">暂无标签</Card> : null}
      </div>

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>新建标签</Modal.Heading></Modal.Header>
            <Modal.Body>
              <TextField isRequired name="name">
                <Label>标签名</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
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
