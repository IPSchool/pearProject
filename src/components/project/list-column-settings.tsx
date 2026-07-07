import { Button, Modal } from "@heroui/react";
import clsx from "clsx";

import {
  LIST_COLUMNS,
  type ListColumnKey,
  saveVisibleColumns,
} from "@/lib/list-view-columns";

interface ListColumnSettingsProps {
  projectCode: string;
  visible: ListColumnKey[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (keys: ListColumnKey[]) => void;
}

export function ListColumnSettings({
  projectCode,
  visible,
  open,
  onOpenChange,
  onChange,
}: ListColumnSettingsProps) {
  function toggle(key: ListColumnKey) {
    const col = LIST_COLUMNS.find((c) => c.key === key);
    if (col?.locked) return;
    const next = visible.includes(key)
      ? visible.filter((k) => k !== key)
      : [...visible, key];
    onChange(next);
    saveVisibleColumns(projectCode, next);
  }

  function reset() {
    const defaults = LIST_COLUMNS.map((c) => c.key);
    onChange(defaults);
    saveVisibleColumns(projectCode, defaults);
  }

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>列配置</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="type-hint mb-3">选择要在列表中显示的列。</p>
            <ul className="space-y-2">
              {LIST_COLUMNS.map((col) => {
                const checked = visible.includes(col.key);
                return (
                  <li key={col.key}>
                    <button
                      className={clsx(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
                        checked
                          ? "border-[var(--ads-color-brand)] bg-[var(--ads-color-background-selected)]"
                          : "border-separator hover:bg-[var(--ads-color-background-neutral)]",
                        col.locked && "opacity-70 cursor-not-allowed",
                      )}
                      disabled={col.locked}
                      type="button"
                      onClick={() => toggle(col.key)}
                    >
                      <span className="type-body">{col.label}</span>
                      <span className="type-hint">{checked ? "显示" : "隐藏"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={reset}>
              恢复默认
            </Button>
            <Button onPress={() => onOpenChange(false)}>完成</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
