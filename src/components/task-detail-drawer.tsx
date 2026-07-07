import { Button, Modal } from "@heroui/react";

import { TaskDetailPanel } from "@/components/task-detail-panel";

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
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>任务详情</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {taskCode ? (
              <TaskDetailPanel taskCode={taskCode} variant="drawer" onUpdated={onUpdated} />
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>
              关闭
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
