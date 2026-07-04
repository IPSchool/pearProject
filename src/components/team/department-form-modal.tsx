import { useEffect, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  TextField,
} from "@heroui/react";

import * as deptApi from "@/api/department";

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  departmentCode?: string;
  parentDepartmentCode?: string;
  parentName?: string;
  initialName?: string;
}

export function DepartmentFormModal({
  open,
  onClose,
  onSaved,
  departmentCode,
  parentDepartmentCode = "",
  parentName,
  initialName = "",
}: DepartmentFormModalProps) {
  const isEdit = Boolean(departmentCode);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && departmentCode) {
        await deptApi.editDepartment(departmentCode, name.trim());
      } else {
        await deptApi.createDepartment(name.trim(), parentDepartmentCode);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{isEdit ? "编辑部门" : "创建部门"}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            {parentName ? (
              <p className="text-sm text-muted">上级部门：{parentName}</p>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <TextField isRequired name="deptName">
              <Label>部门名称</Label>
              <InputGroup>
                <InputGroup.Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </InputGroup>
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>取消</Button>
            <Button isPending={saving} onPress={handleSave}>保存</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
