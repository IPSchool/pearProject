import { useCallback, useState } from "react";
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
import { PageHeader } from "@/components/typography";
import { useProjectRoute } from "@/contexts/project-context";
import { useRealtimeProjectRefresh } from "@/hooks/use-realtime-project-refresh";
import * as taskStagesApi from "@/api/taskStages";
import * as taskApi from "@/api/task";
import { fetchTaskStages } from "@/api/task";
import type { TaskItem, TaskStage } from "@/types/api";

export default function ProjectTasksPage() {
  const { apiCode, pathId } = useProjectRoute();
  const projectCode = apiCode || pathId;
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [stageOpen, setStageOpen] = useState(false);
  const [stageName, setStageName] = useState("");
  const [stageSaving, setStageSaving] = useState(false);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  useRealtimeProjectRefresh(projectCode, bumpRefresh);

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

  async function handleCreateStage() {
    if (!stageName.trim()) return;
    setStageSaving(true);
    try {
      await taskStagesApi.createTaskStage(projectCode, stageName.trim());
      setStageOpen(false);
      setStageName("");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "创建列失败");
    } finally {
      setStageSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <>
            <Button variant="secondary" onPress={() => setStageOpen(true)}>
              新建列
            </Button>
            <Button onPress={openCreate}>创建任务</Button>
          </>
        }
        size="medium"
        title="任务看板"
      />

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

      <Modal.Backdrop isOpen={stageOpen} onOpenChange={setStageOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>新建看板列</Modal.Heading></Modal.Header>
            <Modal.Body>
              <TextField isRequired name="stageName">
                <Label>列名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setStageOpen(false)}>取消</Button>
              <Button isPending={stageSaving} onPress={handleCreateStage}>创建</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
