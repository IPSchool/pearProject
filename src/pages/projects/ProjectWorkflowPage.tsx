import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";

import * as workflowApi from "@/api/workflow";
import type { TaskWorkflow } from "@/api/workflow";
import { PageHeader } from "@/components/typography";

export default function ProjectWorkflowPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [workflows, setWorkflows] = useState<TaskWorkflow[]>([]);
  const [rules, setRules] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, ruleData] = await Promise.all([
        workflowApi.fetchWorkflows(projectCode),
        workflowApi.fetchWorkflowRules(projectCode),
      ]);
      setWorkflows(list);
      setRules(ruleData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workflowApi.createWorkflow(projectCode, name.trim());
      setOpen(false);
      setName("");
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
        actions={<Button onPress={() => setOpen(true)}>新建工作流</Button>}
        size="medium"
        title="任务工作流"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {workflows.map((w) => (
              <Card key={w.code} className="p-4">
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-muted mt-1">{w.code}</p>
              </Card>
            ))}
            {!workflows.length ? (
              <Card className="p-8 col-span-full text-center text-muted">暂无工作流</Card>
            ) : null}
          </div>
          <Card className="p-4">
            <p className="font-medium mb-2">流转规则</p>
            <pre className="text-xs text-muted overflow-auto max-h-48">
              {JSON.stringify(rules, null, 2) || "无规则数据"}
            </pre>
          </Card>
        </>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>新建工作流</Modal.Heading></Modal.Header>
            <Modal.Body>
              <TextField isRequired name="name">
                <Label>名称</Label>
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
