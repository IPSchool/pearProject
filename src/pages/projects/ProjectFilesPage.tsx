import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Alert, Button, Card, Chip, Spinner } from "@heroui/react";

import * as fileApi from "@/api/file";
import type { ProjectFile } from "@/api/file";
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import { fileTypeLabel, fileTypeTone, formatFileSize } from "@/lib/file-display";

export default function ProjectFilesPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fileApi.fetchProjectFiles(projectCode);
      setFiles(data.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      await fileApi.uploadProjectFile(projectCode, file);
      setMessage(`已上传「${file.name}」`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function onPickFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) void onUpload(file);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        description="项目附件集中存放，支持上传文档、图片与设计稿，成员均可下载。"
        size="medium"
        title="项目文件"
      />

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

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <Card
        className={clsx(
          "border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-[var(--ads-color-brand)] bg-accent/5"
            : "border-separator hover:border-[var(--ads-color-brand)]/50 hover:bg-surface-sunken/50",
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onPickFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <p className="type-body text-subtle">正在上传…</p>
          </div>
        ) : (
          <>
            <p className="type-body font-medium">拖拽文件到此处，或点击选择</p>
            <p className="type-meta mt-1 text-subtle">单文件上传，上传后全项目成员可见</p>
            <Button className="mt-4" size="sm" variant="secondary" onPress={() => inputRef.current?.click()}>
              选择文件
            </Button>
          </>
        )}
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : files.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-separator bg-surface-sunken/80 text-left type-meta text-subtle">
                  <th className="px-4 py-3 font-medium">文件名</th>
                  <th className="px-4 py-3 font-medium w-24">类型</th>
                  <th className="px-4 py-3 font-medium w-24">大小</th>
                  <th className="px-4 py-3 font-medium w-28">上传者</th>
                  <th className="px-4 py-3 font-medium w-36">时间</th>
                  <th className="px-4 py-3 font-medium w-20 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.code} className="border-b border-separator last:border-0 hover:bg-surface-sunken/40">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[280px]" title={f.name}>
                        {f.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={fileTypeTone(f.extension)} size="sm" variant="soft">
                        {fileTypeLabel(f.extension)}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-subtle">{formatFileSize(f.size)}</td>
                    <td className="px-4 py-3 text-subtle truncate">{f.creatorName ?? "—"}</td>
                    <td className="px-4 py-3 text-subtle whitespace-nowrap">
                      {f.create_time?.slice(0, 16) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.url ? (
                        <a
                          className="text-accent hover:underline"
                          href={f.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          下载
                        </a>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-separator px-4 py-2 type-meta text-subtle">
            共 {files.length} 个文件
          </div>
        </Card>
      ) : (
        <Card className="p-10 text-center type-meta text-subtle">
          暂无文件，使用上方区域上传第一个附件
        </Card>
      )}
    </div>
  );
}
