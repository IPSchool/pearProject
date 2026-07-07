import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, InputGroup, Label, Modal, TextField } from "@heroui/react";

import { createProject } from "@/api/project";
import { FolderIcon, PlusIcon, TaskIcon } from "@/components/nav-icon";

export function AppCreateMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleCreateProject() {
    const name = projectName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createProject(name);
      setProjectOpen(false);
      setOpen(false);
      setProjectName("");
      if (created?.code) {
        navigate(`/project/${created.code}/overview`);
      } else {
        navigate("/projects");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div ref={menuRef} className="relative shrink-0">
        <Button
          aria-expanded={open}
          aria-haspopup="menu"
          className="gap-1.5 font-medium"
          size="sm"
          onPress={() => setOpen((o) => !o)}
        >
          <PlusIcon className="size-4" />
          创建
        </Button>
        {open ? (
          <>
            <button
              aria-label="关闭菜单"
              className="fixed inset-0 z-40 cursor-default"
              type="button"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-separator bg-surface py-1 shadow-lg"
              role="menu"
            >
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 type-body text-left hover:bg-[var(--ads-color-background-neutral)]"
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  setProjectOpen(true);
                }}
              >
                <FolderIcon className="size-4 shrink-0 opacity-70" />
                项目
              </button>
              <Link
                className="flex items-center gap-2.5 px-3 py-2 type-body hover:bg-[var(--ads-color-background-neutral)]"
                role="menuitem"
                to="/my-tasks"
                onClick={() => setOpen(false)}
              >
                <TaskIcon className="size-4 shrink-0 opacity-70" />
                我的任务
              </Link>
            </div>
          </>
        ) : null}
      </div>

      <Modal.Backdrop isOpen={projectOpen} onOpenChange={setProjectOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>创建项目</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              {error ? <p className="type-body text-danger">{error}</p> : null}
              <TextField name="projectName">
                <Label>项目名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    autoFocus
                    placeholder="输入项目名称"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateProject();
                    }}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setProjectOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={handleCreateProject}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
