import { http, isOk, post } from "@/api/client";

export interface ProjectFile {
  code: string;
  name: string;
  url?: string;
  size?: number;
  create_time?: string;
  extension?: string;
}

export async function fetchProjectFiles(
  projectCode: string,
  page = 1,
  pageSize = 20,
) {
  const res = await post<{ list: ProjectFile[]; total: number }>("project/file/index", {
    projectCode,
    page,
    pageSize,
  });
  if (!isOk(res)) throw new Error(res.msg || "获取文件失败");
  return res.data;
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
