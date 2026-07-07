import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    name: "",
    mobile: "",
    password: "",
    password2: "",
    captcha: "",
  });
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function sendCaptcha() {
    if (!form.mobile.trim()) {
      setError("请先填写手机号");
      return;
    }
    setSmsLoading(true);
    setError(null);
    try {
      await authApi.requestCaptcha(form.mobile.trim());
      setInfo("验证码已发送（请查看短信或 Redis 测试环境）");
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setSmsLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.requestRegister({
        ...form,
        password: md5(form.password),
        password2: md5(form.password2),
      });
      setInfo("注册成功，请登录");
      navigate("/member/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 shadow-surface">
      <Card.Header className="flex flex-col items-start gap-1 pb-0">
        <Card.Title className="type-heading-large">注册</Card.Title>
        <Card.Description>对接 Legacy `login/register` + 短信验证码</Card.Description>
      </Card.Header>
      <Card.Content className="pt-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>{error}</Alert.Content>
            </Alert>
          ) : null}
          {info ? (
            <Alert status="accent">
              <Alert.Indicator />
              <Alert.Content>{info}</Alert.Content>
            </Alert>
          ) : null}

          <TextField isRequired name="name">
            <Label>姓名</Label>
            <InputGroup>
              <InputGroup.Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </InputGroup>
          </TextField>
          <TextField isRequired name="email">
            <Label>邮箱</Label>
            <InputGroup>
              <InputGroup.Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </InputGroup>
          </TextField>
          <TextField isRequired name="mobile">
            <Label>手机号</Label>
            <InputGroup>
              <InputGroup.Input value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
              <InputGroup.Suffix>
                <Button isPending={smsLoading} size="sm" variant="tertiary" onPress={sendCaptcha}>
                  验证码
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          <TextField isRequired name="captcha">
            <Label>短信验证码</Label>
            <InputGroup>
              <InputGroup.Input value={form.captcha} onChange={(e) => setField("captcha", e.target.value)} />
            </InputGroup>
          </TextField>
          <TextField isRequired name="password" type="password">
            <Label>密码</Label>
            <InputGroup>
              <InputGroup.Input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
              />
            </InputGroup>
          </TextField>
          <TextField isRequired name="password2" type="password">
            <Label>确认密码</Label>
            <InputGroup>
              <InputGroup.Input
                type="password"
                value={form.password2}
                onChange={(e) => setField("password2", e.target.value)}
              />
            </InputGroup>
          </TextField>

          <Button className="w-full" isPending={loading} type="submit">
            注册
          </Button>
        </form>
      </Card.Content>
      <Card.Footer className="text-sm text-muted">
        已有账号？{" "}
        <Link className="text-accent hover:underline" to="/member/login">
          登录
        </Link>
      </Card.Footer>
    </Card>
  );
}
