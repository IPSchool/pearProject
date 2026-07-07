import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, InputGroup, Label, Spinner, TextField } from "@heroui/react";

import * as projectInfoApi from "@/api/projectInfo";
import { MarkdownContent } from "@/components/markdown-content";
import { INFO_TYPE_WIKI } from "@/lib/project-info-types";

export default function ProjectWikiEditorPage() {
  const { code: projectCode = "", pageCode = "" } = useParams<{ code: string; pageCode: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await projectInfoApi.fetchProjectInfoBlocks(projectCode);
      const page = all.find((p) => p.code === pageCode && p.description === INFO_TYPE_WIKI);
      if (!page) throw new Error("页面不存在");
      setTitle(page.name);
      setBody(page.value ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode, pageCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await projectInfoApi.editProjectInfoBlock(pageCode, title.trim(), body, INFO_TYPE_WIKI);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("确定删除此 Wiki 页面？")) return;
    await projectInfoApi.deleteProjectInfoBlock(pageCode);
    navigate(`/project/${projectCode}/wiki`);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TextField className="max-w-md flex-1" name="title">
          <Label>标题</Label>
          <InputGroup>
            <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </InputGroup>
        </TextField>
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => setPreview((p) => !p)}>
            {preview ? "编辑" : "预览"}
          </Button>
          <Button isPending={saving} onPress={save}>保存</Button>
          <Button variant="tertiary" onPress={remove}>删除</Button>
        </div>
      </div>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      {preview ? (
        <Card className="p-6 min-h-[20rem]">
          <MarkdownContent source={body} />
        </Card>
      ) : (
        <textarea
          className="min-h-[24rem] w-full rounded-lg border border-separator bg-surface p-4 font-mono text-sm leading-relaxed outline-none focus:border-[var(--ads-color-brand)]"
          placeholder="Markdown 内容…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      )}
    </div>
  );
}
