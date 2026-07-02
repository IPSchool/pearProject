import { useEffect, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import * as taskApi from "@/api/task";
import type { TaskItem } from "@/types/api";

interface TaskDetailDrawerProps {
  taskCode: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function TaskDetailDrawer({
  taskCode,
  open,
  onClose,
  onUpdated,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !taskCode) {
      setTask(null);
      return;
    }
    setLoading(true);
    setError(null);
    taskApi
      .fetchTask(taskCode)
      .then(setTask)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [open, taskCode]);

  async function toggleDone() {
    if (!task) return;
    setSubmitting(true);
    try {
      await taskApi.markTaskDone(task.code, task.done ? 0 : 1);
      onUpdated();
      const updated = await taskApi.fetchTask(task.code);
      setTask(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitComment() {
    if (!task || !comment.trim()) return;
    setSubmitting(true);
    try {
      await taskApi.createComment(task.code, comment.trim());
      setComment("");
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "评论失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{task?.name ?? "任务详情"}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <p className="text-danger text-sm">{error}</p>
            ) : task ? (
              <div className="space-y-4">
                <div className="text-sm text-muted space-y-1">
                  <p>优先级：{task.priText ?? "—"}</p>
                  <p>状态：{task.statusText ?? "—"}</p>
                  <p>截止：{task.end_time ?? "—"}</p>
                </div>
                {task.description ? (
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                ) : null}
                <TextField name="comment">
                  <Label>评论</Label>
                  <InputGroup>
                    <InputGroup.Input
                      placeholder="写下评论..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </InputGroup>
                </TextField>
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>
              关闭
            </Button>
            {task ? (
              <>
                <Button isPending={submitting} variant="secondary" onPress={toggleDone}>
                  {task.done ? "标记未完成" : "标记完成"}
                </Button>
                <Button isPending={submitting} onPress={submitComment}>
                  发送评论
                </Button>
              </>
            ) : null}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
