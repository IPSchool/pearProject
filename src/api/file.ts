import { http, isOk, post } from "@/api/client";

export interface ProjectFile {
  code: string;
  name: string;
  title?: string;
  url?: string;
  size?: number;
  create_time?: string;
  extension?: string;
  creatorName?: string;
}

function normalizeProjectFile(raw: Record<string, unknown>): ProjectFile {
  const title = String(raw.title ?? raw.name ?? "未命名");
  const ext = String(raw.extension ?? "");
  const fullName = raw.fullName ? String(raw.fullName) : ext ? `${title}.${ext}` : title;
  return {
    code: String(raw.code ?? ""),
    name: fullName,
    title,
    url: String(raw.file_url ?? raw.url ?? ""),
    size: raw.size != null ? Number(raw.size) : undefined,
    create_time: raw.create_time ? String(raw.create_time) : undefined,
    extension: ext || undefined,
    creatorName: raw.creatorName ? String(raw.creatorName) : undefined,
  };
}

export async function fetchProjectFiles(
  projectCode: string,
  page = 1,
  pageSize = 50,
) {
  const res = await post<{ list: Record<string, unknown>[]; total: number }>(
    "project/file/index",
    {
      projectCode,
      page,
      pageSize,
    },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取文件失败");
  const list = (res.data.list ?? []).map(normalizeProjectFile);
  return { ...res.data, list };
}

export async function uploadProjectFile(projectCode: string, file: File) {
  const identifier = crypto.randomUUID();
  const form = new FormData();
  form.append("identifier", identifier);
  form.append("filename", file.name);
  form.append("chunkNumber", "1");
  form.append("totalChunks", "1");
  form.append("totalSize", String(file.size));
  form.append("projectCode", projectCode);
  form.append("file", file);

  const response = await http.post<{ code: number; msg: string; data: { url?: string; key?: string } }>(
    "project/file/uploadFiles",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const body = response.data;
  body.code = Number(body.code);
  if (!isOk(body)) throw new Error(body.msg || "上传失败");
  return body.data;
}

export async function recycleFile(fileCode: string) {
  const res = await post("project/file/recycle", { fileCode });
  if (!isOk(res)) throw new Error(res.msg || "移入回收站失败");
}
