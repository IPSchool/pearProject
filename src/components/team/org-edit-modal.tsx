import { useEffect, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  TextField,
} from "@heroui/react";

import * as orgApi from "@/api/organization";
import type { OrganizationItem } from "@/types/api";

interface OrgEditModalProps {
  open: boolean;
  org: OrganizationItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function OrgEditModal({ open, org, onClose, onSaved }: OrgEditModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setAddress(org.address ?? "");
    }
  }, [org]);

  async function save() {
    if (!org || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await orgApi.editOrganization(org.code, name.trim(), address);
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
          <Modal.Header><Modal.Heading>编辑组织</Modal.Heading></Modal.Header>
          <Modal.Body className="space-y-4">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <TextField isRequired name="orgName">
              <Label>组织名称</Label>
              <InputGroup>
                <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
              </InputGroup>
            </TextField>
            <TextField name="address">
              <Label>地址</Label>
              <InputGroup>
                <InputGroup.Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </InputGroup>
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>取消</Button>
            <Button isPending={saving} onPress={save}>保存</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
