import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import * as projectInfoApi from "@/api/projectInfo";
import { MarkdownContent } from "@/components/markdown-content";
import { INFO_TYPE_WIKI } from "@/lib/project-info-types";
import type { ProjectInfoBlock } from "@/types/api";

export default function ProjectWikiPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [pages, setPages] = useState<ProjectInfoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await projectInfoApi.fetchProjectInfoBlocks(projectCode);
      setPages(all.filter((p) => p.description === INFO_TYPE_WIKI));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const created = await projectInfoApi.createProjectInfoBlock(
        projectCode,
        title.trim(),
        "# " + title.trim() + "\n\n在此编写 Markdown 文档…",
        INFO_TYPE_WIKI,
      );
      setOpen(false);
      setTitle("");
      if (created?.code) {
        navigate(`/project/${projectCode}/wiki/${created.code}`);
      } else {
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="type-heading-small">项目文档</h2>
          <p className="type-meta mt-1">Wiki 页面，支持 Markdown 格式（基于 projectInfo）</p>
        </div>
        <Button onPress={() => setOpen(true)}>新建页面</Button>
      </div>

      {error ? <Card className="p-4 text-danger">{error}</Card> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Link key={page.code} to={`/project/${projectCode}/wiki/${page.code}`}>
            <Card className="h-full p-4 hover:shadow-md transition-shadow">
              <p className="type-body font-medium">{page.name}</p>
              <div className="mt-2 line-clamp-4 type-hint">
                <MarkdownContent source={(page.value ?? "").slice(0, 280)} />
              </div>
            </Card>
          </Link>
        ))}
        {!pages.length ? (
          <Card className="p-8 col-span-full text-center type-meta">
            暂无文档页面，点击「新建页面」开始编写 Wiki
          </Card>
        ) : null}
      </div>

      <Modal isOpen={open} onOpenChange={setOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.Header>新建 Wiki 页面</Modal.Header>
              <Modal.Body className="space-y-3">
                <TextField isRequired name="title">
                  <Label>页面标题</Label>
                  <InputGroup>
                    <InputGroup.Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setOpen(false)}>取消</Button>
                <Button isPending={saving} onPress={handleCreate}>创建</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
