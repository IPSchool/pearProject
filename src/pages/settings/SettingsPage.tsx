import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import md5 from "md5";

import * as authApi from "@/api/auth";
import { PageHeader } from "@/components/typography";
import { useAuthStore } from "@/stores/auth";

export default function SettingsPage() {
  const member = useAuthStore((s) => s.member);
  const updateMember = useAuthStore((s) => s.updateMember);

  const [name, setName] = useState("");
  const [realname, setRealname] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name ?? "");
      setRealname(member.realname ?? "");
      setDescription(member.description ?? "");
      setEmail(member.email ?? "");
    }
  }, [member]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authApi.editPersonal({ name, realname, description, email });
      updateMember({ name, realname, description, email });
      setMessage("资料已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authApi.editPassword({
        oldPassword: md5(oldPassword),
        newPassword: md5(newPassword),
        newPassword2: md5(newPassword2),
      });
      setMessage("密码已更新");
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        description="修改头像、昵称与登录密码"
        title="个人设置"
      />

      {message ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>{message}</Alert.Content>
        </Alert>
      ) : null}
      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      ) : null}

      <Card className="p-6">
        <form className="space-y-4" onSubmit={saveProfile}>
          <p className="font-medium">基本资料</p>
          <TextField name="name">
            <Label>昵称</Label>
            <InputGroup>
              <InputGroup.Input value={name} onChange={(e) => setName(e.target.value)} />
            </InputGroup>
          </TextField>
          <TextField name="realname">
            <Label>真实姓名</Label>
            <InputGroup>
              <InputGroup.Input value={realname} onChange={(e) => setRealname(e.target.value)} />
            </InputGroup>
          </TextField>
          <TextField name="email">
            <Label>邮箱</Label>
            <InputGroup>
              <InputGroup.Input value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <Button isPending={saving} type="submit">
            保存资料
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <form className="space-y-4" onSubmit={savePassword}>
          <p className="font-medium">修改密码</p>
          <TextField name="oldPassword" type="password">
            <Label>当前密码</Label>
            <InputGroup>
              <InputGroup.Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </InputGroup>
          </TextField>
          <TextField name="newPassword" type="password">
            <Label>新密码</Label>
            <InputGroup>
              <InputGroup.Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </InputGroup>
          </TextField>
          <TextField name="newPassword2" type="password">
            <Label>确认新密码</Label>
            <InputGroup>
              <InputGroup.Input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
              />
            </InputGroup>
          </TextField>
          <Button isPending={pwdSaving} type="submit" variant="secondary">
            更新密码
          </Button>
        </form>
      </Card>
    </div>
  );
}
