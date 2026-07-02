import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";

import { KanbanBoard } from "@/components/kanban-board";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import * as taskApi from "@/api/task";
import { fetchTaskStages } from "@/api/task";
import type { TaskItem, TaskStage } from "@/types/api";

export default function ProjectSpacePage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function openCreate() {
    setCreateError(null);
    setNewTaskName("");
    try {
      const list = await fetchTaskStages(projectCode);
      setStages(list);
      setNewTaskStage(list[0]?.code ?? "");
      setCreateOpen(true);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "无法加载看板列");
    }
  }

  async function handleCreate() {
    if (!newTaskName.trim() || !newTaskStage) return;
    setCreating(true);
    setCreateError(null);
    try {
      await taskApi.createTask(projectCode, newTaskStage, newTaskName.trim());
      setCreateOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link className="hover:underline" to="/projects">
              项目
            </Link>
            {" / "}
            {projectCode}
          </p>
          <h2 className="text-2xl font-semibold mt-1">任务看板</h2>
        </div>
        <Button onPress={openCreate}>创建任务</Button>
      </div>

      {createError && !createOpen ? (
        <p className="text-sm text-danger">{createError}</p>
      ) : null}

      <KanbanBoard
        projectCode={projectCode}
        refreshKey={refreshKey}
        onTaskClick={(task) => setSelectedTask(task)}
      />

      <TaskDetailDrawer
        open={!!selectedTask}
        taskCode={selectedTask?.code ?? null}
        onClose={() => setSelectedTask(null)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />

      <Modal.Backdrop isOpen={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>创建任务</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {createError ? <p className="text-sm text-danger">{createError}</p> : null}
              <TextField isRequired name="name">
                <Label>任务名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
              <Select
                aria-label="看板列"
                selectedKey={newTaskStage || null}
                onSelectionChange={(key) => {
                  if (key) setNewTaskStage(String(key));
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {stages.map((s) => (
                      <ListBox.Item key={s.code} id={s.code} textValue={s.name}>
                        {s.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button isPending={creating} onPress={handleCreate}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
