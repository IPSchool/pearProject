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

import * as projectInfoApi from "@/api/projectInfo";
import { createTask, fetchTaskStages } from "@/api/task";
import {
  INFO_TYPE_FORM,
  INFO_TYPE_FORM_RESPONSE,
  parseFormDefinition,
  type ProjectFormDefinition,
} from "@/lib/project-info-types";
import type { ProjectInfoBlock } from "@/types/api";

export default function ProjectFormsPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [forms, setForms] = useState<ProjectInfoBlock[]>([]);
  const [responses, setResponses] = useState<ProjectInfoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<ProjectInfoBlock | null>(null);
  const [title, setTitle] = useState("");
  const [fieldLabel, setFieldLabel] = useState("需求描述");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await projectInfoApi.fetchProjectInfoBlocks(projectCode);
      setForms(all.filter((p) => p.description === INFO_TYPE_FORM));
      setResponses(all.filter((p) => p.description === INFO_TYPE_FORM_RESPONSE));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateForm() {
    if (!title.trim()) return;
    setSaving(true);
    const def: ProjectFormDefinition = {
      title: title.trim(),
      description: "通过表单提交自动创建工作项",
      fields: [{ id: "req", label: fieldLabel.trim() || "需求描述", required: true }],
    };
    try {
      await projectInfoApi.createProjectInfoBlock(
        projectCode,
        title.trim(),
        JSON.stringify(def),
        INFO_TYPE_FORM,
      );
      setCreateOpen(false);
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  function openFill(form: ProjectInfoBlock) {
    setActiveForm(form);
    setAnswers({});
    setFillOpen(true);
  }

  async function submitForm() {
    if (!activeForm) return;
    const def = parseFormDefinition(activeForm.value);
    if (!def) return;
    for (const field of def.fields) {
      if (field.required && !answers[field.id]?.trim()) {
        setError(`请填写：${field.label}`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const stages = await fetchTaskStages(projectCode);
      const stageCode = stages[0]?.code;
      if (!stageCode) throw new Error("项目暂无看板列，无法创建任务");

      const summary = def.fields.map((f) => `${f.label}: ${answers[f.id] ?? ""}`).join("\n");
      const taskTitle = `[表单] ${def.title}`;
      const created = await createTask(projectCode, stageCode, taskTitle);

      await projectInfoApi.createProjectInfoBlock(
        projectCode,
        `${def.title} · ${new Date().toLocaleString("zh-CN")}`,
        JSON.stringify({
          formCode: activeForm.code,
          formTitle: def.title,
          answers,
          submittedAt: new Date().toISOString(),
          taskCode: created?.code,
          summary,
        }),
        INFO_TYPE_FORM_RESPONSE,
      );

      setFillOpen(false);
      setActiveForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="type-heading-small">需求表单</h2>
          <p className="type-meta mt-1">收集利益相关方请求，提交后自动创建看板任务</p>
        </div>
        <Button onPress={() => setCreateOpen(true)}>创建表单</Button>
      </div>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => {
          const def = parseFormDefinition(form.value);
          const count = responses.filter((r) => {
            try {
              const v = JSON.parse(r.value ?? "{}") as { formCode?: string };
              return v.formCode === form.code;
            } catch {
              return false;
            }
          }).length;
          return (
            <Card key={form.code} className="p-5">
              <p className="type-body font-medium">{form.name}</p>
              <p className="type-hint mt-1">{def?.description ?? "表单"}</p>
              <p className="type-meta mt-2">已收到 {count} 条提交</p>
              <Button className="mt-4" size="sm" onPress={() => openFill(form)}>
                填写 / 模拟提交
              </Button>
            </Card>
          );
        })}
        {!forms.length ? (
          <Card className="p-8 col-span-full text-center type-meta">
            暂无表单。创建表单后，团队成员可通过链接提交需求并自动生成任务。
          </Card>
        ) : null}
      </div>

      <Modal isOpen={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.Header>创建表单</Modal.Header>
              <Modal.Body className="space-y-3">
                <TextField isRequired name="title">
                  <Label>表单名称</Label>
                  <InputGroup>
                    <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </InputGroup>
                </TextField>
                <TextField name="field">
                  <Label>主字段标签</Label>
                  <InputGroup>
                    <InputGroup.Input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setCreateOpen(false)}>取消</Button>
                <Button isPending={saving} onPress={handleCreateForm}>创建</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={fillOpen} onOpenChange={setFillOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>{activeForm?.name ?? "提交表单"}</Modal.Header>
              <Modal.Body className="space-y-3">
                {(parseFormDefinition(activeForm?.value)?.fields ?? []).map((field) => (
                  <TextField key={field.id} isRequired={field.required} name={field.id}>
                    <Label>{field.label}</Label>
                    <InputGroup>
                      <InputGroup.Input
                        value={answers[field.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                      />
                    </InputGroup>
                  </TextField>
                ))}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setFillOpen(false)}>取消</Button>
                <Button isPending={saving} onPress={submitForm}>提交并创建任务</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
