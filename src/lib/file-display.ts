export function formatFileSize(bytes?: number | string): string {
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!n || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(ext?: string): string {
  const e = (ext ?? "").toLowerCase();
  if (!e) return "文件";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e)) return "图片";
  if (["pdf"].includes(e)) return "PDF";
  if (["doc", "docx"].includes(e)) return "Word";
  if (["xls", "xlsx", "csv"].includes(e)) return "表格";
  if (["ppt", "pptx"].includes(e)) return "演示";
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return "压缩包";
  if (["md", "txt"].includes(e)) return "文本";
  return e.toUpperCase();
}

export function fileTypeTone(ext?: string): string {
  const e = (ext ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e)) return "text-violet-600";
  if (e === "pdf") return "text-red-600";
  if (["doc", "docx"].includes(e)) return "text-blue-600";
  if (["xls", "xlsx", "csv"].includes(e)) return "text-emerald-600";
  if (["ppt", "pptx"].includes(e)) return "text-orange-600";
  return "text-subtle";
}
