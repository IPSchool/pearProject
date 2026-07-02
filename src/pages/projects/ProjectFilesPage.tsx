import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Chip, Spinner } from "@heroui/react";

import * as fileApi from "@/api/file";
import type { ProjectFile } from "@/api/file";

export default function ProjectFilesPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      await fileApi.uploadProjectFile(projectCode, file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">项目文件</h2>
        <div>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
          <Button isPending={uploading} onPress={() => inputRef.current?.click()}>
            上传文件
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <Card key={f.code} className="p-4">
              <p className="font-medium truncate">{f.name}</p>
              <p className="text-xs text-muted mt-1">{f.create_time ?? "—"}</p>
              {f.extension ? (
                <Chip className="mt-2" size="sm" variant="soft">
                  {f.extension}
                </Chip>
              ) : null}
              {f.url ? (
                <a
                  className="text-sm text-accent mt-2 inline-block hover:underline"
                  href={f.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  打开
                </a>
              ) : null}
            </Card>
          ))}
          {!files.length ? (
            <Card className="p-8 col-span-full text-center text-muted">
              暂无文件，点击上传
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
