import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, InputGroup, Label, Spinner, TextField } from "@heroui/react";

import * as projectInfoApi from "@/api/projectInfo";
import { MarkdownEditor, type MarkdownEditorTab } from "@/components/markdown-editor";
import { useProjectRoute } from "@/contexts/project-context";
import { INFO_TYPE_WIKI } from "@/lib/project-info-types";

export default function ProjectWikiEditorPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const projectPathId = pathId;
  const { pageCode = "" } = useParams<{ pageCode: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<MarkdownEditorTab>("write");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(null);
    try {
      await projectInfoApi.editProjectInfoBlock(pageCode, title.trim(), body, INFO_TYPE_WIKI);
      setEditorTab("preview");
      setMessage("保存成功，已切换到预览");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("确定删除此 Wiki 页面？")) return;
    await projectInfoApi.deleteProjectInfoBlock(pageCode);
    navigate(`/project/${projectPathId}/wiki`);
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
          <Label>页面标题</Label>
          <InputGroup>
            <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </InputGroup>
        </TextField>
        <div className="flex gap-2">
          <Button variant="tertiary" onPress={() => navigate(`/project/${projectPathId}/wiki`)}>
            返回列表
          </Button>
          <Button isPending={saving} onPress={save}>
            保存
          </Button>
          <Button variant="tertiary" onPress={remove}>
            删除
          </Button>
        </div>
      </div>

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

      <MarkdownEditor
        minHeight="28rem"
        placeholder="在此编写 Markdown 文档…"
        tab={editorTab}
        value={body}
        onChange={setBody}
        onTabChange={(next) => {
          setEditorTab(next);
          if (next === "write") setMessage(null);
        }}
      />
    </div>
  );
}
