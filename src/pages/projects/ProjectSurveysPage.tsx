import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import * as projectInfoApi from "@/api/projectInfo";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import {
  INFO_TYPE_SURVEY,
  INFO_TYPE_SURVEY_RESPONSE,
  parseFormDefinition,
  parseFormResponse,
  type ProjectFormDefinition,
  type ProjectFormField,
  type SurveyFieldType,
} from "@/lib/project-info-types";
import type { ProjectInfoBlock } from "@/types/api";
import { useAuthStore } from "@/stores/auth";

const PURPOSE_OPTIONS = [
  { value: "requirement", label: "需求收集" },
  { value: "judgment", label: "事项判断" },
  { value: "general", label: "通用调查" },
] as const;

const FIELD_TYPE_OPTIONS: { value: SurveyFieldType; label: string }[] = [
  { value: "text", label: "单行文本" },
  { value: "textarea", label: "多行说明" },
  { value: "yesno", label: "是 / 否" },
  { value: "radio", label: "单选题" },
];

function purposeLabel(purpose?: string) {
  return PURPOSE_OPTIONS.find((p) => p.value === purpose)?.label ?? "调查问卷";
}

function newField(): ProjectFormField {
  return {
    id: `q_${crypto.randomUUID().slice(0, 8)}`,
    label: "",
    type: "textarea",
    required: true,
  };
}

function responsesForSurvey(responses: ProjectInfoBlock[], formCode: string) {
  return responses.filter((r) => parseFormResponse(r.value)?.formCode === formCode);
}

export default function ProjectSurveysPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const member = useAuthStore((s) => s.member);
  const [surveys, setSurveys] = useState<ProjectInfoBlock[]>([]);
  const [responses, setResponses] = useState<ProjectInfoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<ProjectInfoBlock | null>(null);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<string>("requirement");
  const [intro, setIntro] = useState("");
  const [fields, setFields] = useState<ProjectFormField[]>([newField()]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await projectInfoApi.fetchProjectInfoBlocks(projectCode);
      setSurveys(all.filter((p) => p.description === INFO_TYPE_SURVEY));
      setResponses(all.filter((p) => p.description === INFO_TYPE_SURVEY_RESPONSE));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  const activeResponses = useMemo(
    () => (activeSurvey ? responsesForSurvey(responses, activeSurvey.code) : []),
    [activeSurvey, responses],
  );

  function resetCreateForm() {
    setTitle("");
    setPurpose("requirement");
    setIntro("");
    setFields([newField()]);
  }

  async function handleCreateSurvey() {
    if (!title.trim()) return;
    const validFields = fields.filter((f) => f.label.trim());
    if (!validFields.length) {
      setError("请至少添加一个有效问题");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const def: ProjectFormDefinition = {
      title: title.trim(),
      description: intro.trim() || undefined,
      purpose: purpose as ProjectFormDefinition["purpose"],
      fields: validFields.map((f) => ({
        ...f,
        label: f.label.trim(),
        options:
          f.type === "radio"
            ? (f.options ?? []).map((o) => o.trim()).filter(Boolean)
            : undefined,
      })),
    };
    try {
      await projectInfoApi.createProjectInfoBlock(
        projectCode,
        title.trim(),
        JSON.stringify(def),
        INFO_TYPE_SURVEY,
      );
      setCreateOpen(false);
      resetCreateForm();
      setMessage("问卷已创建");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  function openFill(survey: ProjectInfoBlock) {
    setActiveSurvey(survey);
    setAnswers({});
    setError(null);
    setFillOpen(true);
  }

  function openResponses(survey: ProjectInfoBlock) {
    setActiveSurvey(survey);
    setViewOpen(true);
  }

  async function submitSurvey() {
    if (!activeSurvey) return;
    const def = parseFormDefinition(activeSurvey.value);
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
      await projectInfoApi.createProjectInfoBlock(
        projectCode,
        `${def.title} · ${member?.name ?? "匿名"} · ${new Date().toLocaleString("zh-CN")}`,
        JSON.stringify({
          formCode: activeSurvey.code,
          formTitle: def.title,
          answers,
          submittedAt: new Date().toISOString(),
          submitterName: member?.name,
          submitterCode: member?.code,
        }),
        INFO_TYPE_SURVEY_RESPONSE,
      );
      setFillOpen(false);
      setActiveSurvey(null);
      setMessage("感谢填写，回复已记录");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSaving(false);
    }
  }

  function renderFieldInput(field: ProjectFormField) {
    const value = answers[field.id] ?? "";
    if (field.type === "textarea") {
      return (
        <textarea
          className="min-h-24 w-full rounded-lg border border-separator bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--ads-color-brand)]"
          placeholder={field.placeholder ?? "请输入…"}
          value={value}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
        />
      );
    }
    if (field.type === "yesno") {
      return (
        <div className="flex gap-2">
          {["是", "否"].map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={value === opt ? "primary" : "secondary"}
              onPress={() => setAnswers((prev) => ({ ...prev, [field.id]: opt }))}
            >
              {opt}
            </Button>
          ))}
        </div>
      );
    }
    if (field.type === "radio" && field.options?.length) {
      return (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 type-body cursor-pointer">
              <input
                checked={value === opt}
                name={field.id}
                type="radio"
                onChange={() => setAnswers((prev) => ({ ...prev, [field.id]: opt }))}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }
    return (
      <InputGroup>
        <InputGroup.Input
          placeholder={field.placeholder ?? "请输入…"}
          value={value}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
        />
      </InputGroup>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <Button
            onPress={() => {
              setError(null);
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            新建问卷
          </Button>
        }
        description="用于收集需求、评审事项或干系人意见；仅记录回复，不会自动创建工作项。"
        size="medium"
        title="调查问卷"
      />

      {message ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>{message}</Alert.Content>
        </Alert>
      ) : null}
      {error && !fillOpen && !createOpen ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {surveys.map((survey) => {
          const def = parseFormDefinition(survey.value);
          const count = responsesForSurvey(responses, survey.code).length;
          return (
            <Card key={survey.code} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="type-body font-medium">{survey.name}</p>
                <span className="type-meta shrink-0 rounded-md bg-surface-sunken px-2 py-0.5 text-subtle">
                  {purposeLabel(def?.purpose)}
                </span>
              </div>
              <p className="type-hint mt-2 line-clamp-2">
                {def?.description ?? "收集项目相关反馈与判断"}
              </p>
              <p className="type-meta mt-3 text-subtle">
                {def?.fields.length ?? 0} 道题 · 已收到 {count} 份回复
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onPress={() => openFill(survey)}>
                  填写问卷
                </Button>
                <Button size="sm" variant="secondary" onPress={() => openResponses(survey)}>
                  查看回复 ({count})
                </Button>
              </div>
            </Card>
          );
        })}
        {!surveys.length ? (
          <Card className="p-10 col-span-full text-center type-meta text-subtle">
            暂无问卷。创建后可分发给成员或外部干系人填写，用于需求调研与事项判断。
          </Card>
        ) : null}
      </div>

      {/* 创建问卷 */}
      <Modal isOpen={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg max-h-[90vh] overflow-y-auto">
              <Modal.Header>新建调查问卷</Modal.Header>
              <Modal.Body className="space-y-4">
                <TextField isRequired name="title">
                  <Label>问卷标题</Label>
                  <InputGroup>
                    <InputGroup.Input
                      placeholder="例如：Q2 需求调研"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </InputGroup>
                </TextField>
                <div className="space-y-1.5">
                  <Label>用途</Label>
                  <Select selectedKey={purpose} onSelectionChange={(k) => setPurpose(String(k))}>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {PURPOSE_OPTIONS.map((o) => (
                          <ListBox.Item key={o.value} id={o.value} textValue={o.label}>
                            {o.label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <TextField name="intro">
                  <Label>说明（可选）</Label>
                  <InputGroup>
                    <InputGroup.TextArea
                      placeholder="向填写者说明问卷目的…"
                      rows={2}
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                    />
                  </InputGroup>
                </TextField>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>题目</Label>
                    <Button size="sm" variant="secondary" onPress={() => setFields((f) => [...f, newField()])}>
                      添加题目
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-3 space-y-2 bg-surface-sunken/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="type-meta text-subtle">第 {index + 1} 题</span>
                        {fields.length > 1 ? (
                          <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => setFields((f) => f.filter((x) => x.id !== field.id))}
                          >
                            删除
                          </Button>
                        ) : null}
                      </div>
                      <InputGroup>
                        <InputGroup.Input
                          placeholder="问题描述"
                          value={field.label}
                          onChange={(e) =>
                            setFields((f) =>
                              f.map((x) => (x.id === field.id ? { ...x, label: e.target.value } : x)),
                            )
                          }
                        />
                      </InputGroup>
                      <Select
                        aria-label="题型"
                        selectedKey={field.type ?? "text"}
                        onSelectionChange={(k) =>
                          setFields((f) =>
                            f.map((x) =>
                              x.id === field.id
                                ? {
                                    ...x,
                                    type: String(k) as SurveyFieldType,
                                    options: k === "radio" ? ["选项 A", "选项 B"] : undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {FIELD_TYPE_OPTIONS.map((o) => (
                              <ListBox.Item key={o.value} id={o.value} textValue={o.label}>
                                {o.label}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      {field.type === "radio" ? (
                        <InputGroup>
                          <InputGroup.Input
                            placeholder="选项，用逗号分隔"
                            value={(field.options ?? []).join(", ")}
                            onChange={(e) =>
                              setFields((f) =>
                                f.map((x) =>
                                  x.id === field.id
                                    ? {
                                        ...x,
                                        options: e.target.value.split(",").map((s) => s.trim()),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </InputGroup>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button isPending={saving} onPress={handleCreateSurvey}>
                  创建
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* 填写问卷 */}
      <Modal isOpen={fillOpen} onOpenChange={setFillOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg max-h-[90vh] overflow-y-auto">
              <Modal.Header>{activeSurvey?.name ?? "填写问卷"}</Modal.Header>
              <Modal.Body className="space-y-4">
                {parseFormDefinition(activeSurvey?.value)?.description ? (
                  <p className="type-hint text-subtle border-b border-separator pb-3">
                    {parseFormDefinition(activeSurvey?.value)?.description}
                  </p>
                ) : null}
                {error && fillOpen ? <p className="text-sm text-danger">{error}</p> : null}
                {(parseFormDefinition(activeSurvey?.value)?.fields ?? []).map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label>
                      {field.label}
                      {field.required ? <span className="text-danger"> *</span> : null}
                    </Label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setFillOpen(false)}>
                  取消
                </Button>
                <Button isPending={saving} onPress={submitSurvey}>
                  提交
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* 查看回复 */}
      <Modal isOpen={viewOpen} onOpenChange={setViewOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <Modal.Header>{activeSurvey?.name ?? "问卷回复"}</Modal.Header>
              <Modal.Body className="space-y-4">
                {activeResponses.length ? (
                  activeResponses.map((r) => {
                    const data = parseFormResponse(r.value);
                    if (!data) return null;
                    return (
                      <Card key={r.code} className="p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 type-meta text-subtle">
                          <span>{data.submitterName ?? "匿名"}</span>
                          <span>{new Date(data.submittedAt).toLocaleString("zh-CN")}</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          {Object.entries(data.answers).map(([key, val]) => {
                            const label =
                              parseFormDefinition(activeSurvey?.value)?.fields.find((f) => f.id === key)
                                ?.label ?? key;
                            return (
                              <li key={key}>
                                <span className="text-subtle">{label}：</span>
                                <span className="whitespace-pre-wrap">{val || "—"}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </Card>
                    );
                  })
                ) : (
                  <p className="type-meta text-center text-subtle py-8">暂无回复</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setViewOpen(false)}>
                  关闭
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
