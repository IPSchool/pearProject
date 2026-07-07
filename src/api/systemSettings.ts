import { isOk, post } from "@/api/client";

export type SystemSettingFieldOption = {
  value: string;
  label: string;
};

export type SystemSettingField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select";
  value: string;
  hasValue?: boolean;
  placeholder?: string;
  options?: SystemSettingFieldOption[];
};

export type SystemSettingGroup = {
  id: string;
  label: string;
  description: string;
  fields: SystemSettingField[];
};

export type ConnectionTestResult = {
  ok?: boolean;
  message?: string;
  detail?: string;
  latencyMs?: number;
};

export async function fetchSystemSettingsSchema() {
  const res = await post<{ groups: SystemSettingGroup[] }>(
    "project/systemSettings/schema",
    {},
  );
  if (!isOk(res)) throw new Error(res.msg || "加载系统配置失败");
  return res.data.groups ?? [];
}

export async function saveSystemSettings(settings: Record<string, string>) {
  const res = await post<{ saved: number }>("project/systemSettings/save", {
    settings: JSON.stringify(settings),
  });
  if (!isOk(res)) throw new Error(res.msg || "保存失败");
  return res.data;
}

function buildDraftPayload(settings: Record<string, string>) {
  return { settings: JSON.stringify(settings) };
}

export async function testStorageConnection(settings: Record<string, string>) {
  const res = await post<ConnectionTestResult>(
    "project/systemSettings/testStorage",
    buildDraftPayload(settings),
  );
  if (isOk(res)) return res.data;
  const detail = (res.data as ConnectionTestResult | undefined)?.detail;
  throw new Error(detail ? `${res.msg}：${detail}` : res.msg || "存储测试失败");
}

export async function testLlmConnection(settings: Record<string, string>) {
  const res = await post<ConnectionTestResult>(
    "project/systemSettings/testLlm",
    buildDraftPayload(settings),
  );
  if (isOk(res)) return res.data;
  const detail = (res.data as ConnectionTestResult | undefined)?.detail;
  throw new Error(detail ? `${res.msg}：${detail}` : res.msg || "LLM 测试失败");
}

export async function testMailConnection(settings: Record<string, string>, testEmail: string) {
  const res = await post<ConnectionTestResult>("project/systemSettings/testMail", {
    ...buildDraftPayload(settings),
    testEmail,
  });
  if (isOk(res)) return res.data;
  const detail = (res.data as ConnectionTestResult | undefined)?.detail;
  throw new Error(detail ? `${res.msg}：${detail}` : res.msg || "邮件测试失败");
}
