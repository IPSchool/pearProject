import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import * as featuresApi from "@/api/features";
import type { ProjectFeature } from "@/api/features";
import * as versionApi from "@/api/version";
import type { ProjectVersion } from "@/api/version";
import { PageHeader } from "@/components/typography";

export default function ProjectVersionsPage() {
  const { code: projectCode = "" } = useParams<{ code: string }>();
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeatures = useCallback(async () => {
    const list = await featuresApi.fetchFeatures(projectCode);
    setFeatures(list);
    setSelectedFeature((prev) => prev || list[0]?.code || "");
    return list;
  }, [projectCode]);

  const loadVersions = useCallback(async (featuresCode: string) => {
    if (!featuresCode) {
      setVersions([]);
      return;
    }
    const data = await versionApi.fetchVersions(featuresCode);
    setVersions(data.list);
  }, []);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const list = await loadFeatures();
      const code = selectedFeature || list[0]?.code || "";
      await loadVersions(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [projectCode]);

  useEffect(() => {
    if (!selectedFeature) return;
    loadVersions(selectedFeature).catch((e) => {
      setError(e instanceof Error ? e.message : "加载版本失败");
    });
  }, [selectedFeature, loadVersions]);

  async function handleCreateFeature() {
    if (!featureName.trim()) return;
    setSaving(true);
    try {
      const created = await featuresApi.createFeature(projectCode, featureName.trim());
      setFeatureOpen(false);
      setFeatureName("");
      await loadFeatures();
      if (created?.code) setSelectedFeature(created.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建版本库失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateVersion() {
    if (!selectedFeature || !name.trim()) return;
    setSaving(true);
    try {
      await versionApi.createVersion(selectedFeature, name.trim(), desc);
      setVersionOpen(false);
      setName("");
      setDesc("");
      await loadVersions(selectedFeature);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建版本失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <>
            <Button variant="secondary" onPress={() => setFeatureOpen(true)}>
              新建版本库
            </Button>
            <Button isDisabled={!selectedFeature} onPress={() => setVersionOpen(true)}>
              新建版本
            </Button>
          </>
        }
        size="medium"
        title="版本规划"
      />

      {features.length ? (
        <Select
          aria-label="版本库"
          selectedKey={selectedFeature}
          onSelectionChange={(key) => setSelectedFeature(String(key))}
        >
          <Select.Trigger className="max-w-xs">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {features.map((f) => (
                <ListBox.Item key={f.code} id={f.code} textValue={f.name}>
                  {f.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {versions.map((v) => (
            <Card key={v.code} className="p-4">
              <p className="font-medium">{v.name}</p>
              <p className="text-sm text-muted mt-1">{v.description || "无描述"}</p>
              <div className="flex gap-2 mt-2 text-xs text-muted">
                {v.start_time ? <span>开始 {v.start_time}</span> : null}
                {v.publish_time ? <span>发布 {v.publish_time}</span> : null}
              </div>
              {v.status !== undefined ? (
                <Chip className="mt-2" size="sm" variant="soft">
                  状态 {v.status}
                </Chip>
              ) : null}
            </Card>
          ))}
          {!versions.length ? (
            <Card className="p-8 col-span-full text-center text-muted">
              {features.length ? "该版本库暂无版本" : "请先创建版本库"}
            </Card>
          ) : null}
        </div>
      )}

      <Modal.Backdrop isOpen={featureOpen} onOpenChange={setFeatureOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>新建版本库</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField isRequired name="featureName">
                <Label>版本库名称</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setFeatureOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={handleCreateFeature}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={versionOpen} onOpenChange={setVersionOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>新建版本</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="name">
                <Label>版本名称</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="desc">
                <Label>描述</Label>
                <InputGroup>
                  <InputGroup.Input value={desc} onChange={(e) => setDesc(e.target.value)} />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setVersionOpen(false)}>
                取消
              </Button>
              <Button isPending={saving} onPress={handleCreateVersion}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
