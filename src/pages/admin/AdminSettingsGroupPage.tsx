import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputGroup,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import * as systemSettingsApi from "@/api/systemSettings";
import type { SystemSettingField, SystemSettingGroup } from "@/api/systemSettings";
import { useSitePublicStore } from "@/stores/site-public";

const SECRET_MASK = "******";

function SettingField({
  field,
  value,
  onChange,
}: {
  field: SystemSettingField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const hint =
    field.type === "password" && field.hasValue && value === SECRET_MASK
      ? "已配置，留空则不修改"
      : undefined;

  if (field.type === "textarea") {
    return (
      <TextField name={field.key}>
        <Label>{field.label}</Label>
        <InputGroup>
          <InputGroup.TextArea
            placeholder={field.placeholder ?? hint}
            rows={3}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </InputGroup>
      </TextField>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <Select
          aria-label={field.label}
          selectedKey={value || field.options[0]?.value}
          onSelectionChange={(key) => onChange(field.key, String(key ?? ""))}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {field.options.map((opt) => (
                <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
  }

  return (
    <TextField name={field.key} type={field.type === "password" ? "password" : "text"}>
      <Label>{field.label}</Label>
      <InputGroup>
        <InputGroup.Input
          placeholder={field.placeholder ?? hint}
          type={field.type === "password" ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </InputGroup>
    </TextField>
  );
}

export function AdminSettingsGroupPage({
  groupId,
  testKind,
}: {
  groupId: string;
  testKind?: "storage" | "llm" | "mail";
}) {
  const [group, setGroup] = useState<SystemSettingGroup | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    title: string;
    detail?: string;
    latencyMs?: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const groups = await systemSettingsApi.fetchSystemSettingsSchema();
      const found = groups.find((g) => g.id === groupId) ?? null;
      setGroup(found);
      const initial: Record<string, string> = {};
      for (const field of found?.fields ?? []) {
        initial[field.key] = field.value ?? "";
      }
      setValues(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload(): Record<string, string> {
    if (!group) return {};
    const payload: Record<string, string> = {};
    for (const field of group.fields) {
      const v = values[field.key] ?? "";
      if (field.type === "password" && v === SECRET_MASK) {
        continue;
      }
      payload[field.key] = v;
    }
    return payload;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    setTestResult(null);
    try {
      await systemSettingsApi.saveSystemSettings(buildPayload());
      setMessage("已保存");
      if (groupId === "site") {
        await useSitePublicStore.getState().load();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function onTestConnection() {
    if (!testKind) return;
    setTesting(true);
    setTestResult(null);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload();
      const result =
        testKind === "storage"
          ? await systemSettingsApi.testStorageConnection(payload)
          : testKind === "mail"
            ? await systemSettingsApi.testMailConnection(payload, testEmail.trim())
            : await systemSettingsApi.testLlmConnection(payload);
      setTestResult({
        ok: true,
        title: result.message ?? "连接成功",
        detail: result.detail,
        latencyMs: result.latencyMs,
      });
    } catch (e) {
      setTestResult({
        ok: false,
        title: e instanceof Error ? e.message : "测试失败",
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!group) {
    return <Card className="p-6 text-muted">未找到配置分组</Card>;
  }

  return (
    <form className="space-y-4" onSubmit={onSave}>
      {group.description ? (
        <p className="type-body text-subtle">{group.description}</p>
      ) : null}

      {message ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>{message}</Alert.Content>
        </Alert>
      ) : null}
      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      ) : null}

      {testResult ? (
        <Alert status={testResult.ok ? "success" : "danger"}>
          <Alert.Indicator />
          <Alert.Content>
            <p>{testResult.title}</p>
            {testResult.detail ? (
              <p className="mt-1 text-sm opacity-90">{testResult.detail}</p>
            ) : null}
            {testResult.latencyMs != null ? (
              <p className="mt-1 text-xs opacity-75">耗时 {testResult.latencyMs} ms</p>
            ) : null}
          </Alert.Content>
        </Alert>
      ) : null}

      <Card className="p-6 space-y-4">
        {group.fields.map((field) => (
          <SettingField
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={setField}
          />
        ))}
        {testKind === "mail" ? (
          <TextField name="testEmail">
            <Label>测试收件邮箱</Label>
            <InputGroup>
              <InputGroup.Input
                placeholder="发送测试信到此邮箱"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </InputGroup>
          </TextField>
        ) : null}
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        {testKind ? (
          <Button isPending={testing} type="button" variant="secondary" onPress={onTestConnection}>
            测试连接
          </Button>
        ) : null}
        <Button type="button" variant="tertiary" onPress={load}>
          重置
        </Button>
        <Button isPending={saving} type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}
