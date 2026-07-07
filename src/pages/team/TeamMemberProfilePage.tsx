import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  InputGroup,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";

import { MemberAvatar } from "@/components/member-avatar";
import * as accountApi from "@/api/account";
import * as taskApi from "@/api/task";
import * as projectApi from "@/api/project";
import type { AccountItem, ProjectSummary, TaskItem } from "@/types/api";

export default function TeamMemberProfilePage() {
  const { code = "" } = useParams();
  const [profile, setProfile] = useState<AccountItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [position, setPosition] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const [acc, taskData, projData] = await Promise.all([
        accountApi.readAccount(code),
        taskApi.fetchMyTasks(1, 20).catch(() => ({ list: [] as TaskItem[] })),
        projectApi.fetchSelfProjects(1, 20).catch(() => ({ list: [] as ProjectSummary[] })),
      ]);
      setProfile(acc);
      setName(acc.name ?? "");
      setEmail(acc.email ?? "");
      setMobile(acc.mobile ?? "");
      setPosition(acc.position ?? "");
      setDescription(acc.description ?? "");
      setTasks(taskData.list ?? []);
      setProjects(projData.list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [code]);

  async function saveEdit() {
    if (!code) return;
    setSaving(true);
    try {
      await accountApi.editAccount({
        code,
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        position: position.trim(),
        description: description.trim(),
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function syncDetail() {
    if (!code) return;
    try {
      await accountApi.syncAccountDetail(code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败");
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!profile) return <p className="text-muted">成员不存在</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link className="text-sm text-accent hover:underline" to="/team/members">
        ← 返回团队成员
      </Link>
      {error ? <p className="text-danger text-sm">{error}</p> : null}

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <MemberAvatar className="size-14" name={profile.name} src={profile.avatar} />
          <div className="flex-1">
            <h3 className="type-heading-medium">{profile.name}</h3>
            <p className="text-muted text-sm mt-1">{profile.email}</p>
            <p className="text-muted text-sm">{profile.mobile || "未绑定手机"}</p>
            {profile.departments ? (
              <p className="text-sm mt-2">部门：{profile.departments}</p>
            ) : null}
            {profile.description ? (
              <p className="text-sm mt-2 whitespace-pre-wrap">{profile.description}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="tertiary" onPress={syncDetail}>同步资料</Button>
            <Button size="sm" onPress={() => setEditOpen(true)}>编辑</Button>
          </div>
        </div>
      </Card>

      <section>
        <h4 className="font-medium mb-3">相关任务</h4>
        <ul className="space-y-2">
          {tasks.slice(0, 10).map((t) => (
            <Card key={t.code} className="p-3 text-sm">{t.name}</Card>
          ))}
          {!tasks.length ? <Card className="p-4 text-muted text-sm">暂无任务</Card> : null}
        </ul>
      </section>

      <section>
        <h4 className="font-medium mb-3">相关项目</h4>
        <ul className="space-y-2">
          {projects.slice(0, 10).map((p) => (
            <Card key={p.code} className="p-3 text-sm">
              <Link className="hover:text-accent" to={`/project/${p.code}/overview`}>
                {p.name}
              </Link>
            </Card>
          ))}
          {!projects.length ? <Card className="p-4 text-muted text-sm">暂无项目</Card> : null}
        </ul>
      </section>

      <Modal.Backdrop isOpen={editOpen} onOpenChange={setEditOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>编辑成员</Modal.Heading></Modal.Header>
            <Modal.Body className="space-y-4">
              <TextField isRequired name="name">
                <Label>姓名</Label>
                <InputGroup>
                  <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="email">
                <Label>邮箱</Label>
                <InputGroup>
                  <InputGroup.Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="mobile">
                <Label>手机</Label>
                <InputGroup>
                  <InputGroup.Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="position">
                <Label>职位</Label>
                <InputGroup>
                  <InputGroup.Input value={position} onChange={(e) => setPosition(e.target.value)} />
                </InputGroup>
              </TextField>
              <TextField name="description">
                <Label>简介</Label>
                <InputGroup>
                  <InputGroup.Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setEditOpen(false)}>取消</Button>
              <Button isPending={saving} onPress={saveEdit}>保存</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
