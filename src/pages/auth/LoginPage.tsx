import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import md5 from "md5";

import { useAuthStore } from "@/stores/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [account, setAccount] = useState("Lincoln");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    "/workbench";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(account.trim(), md5(password));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 shadow-surface">
      <Card.Header className="flex flex-col items-start gap-1 pb-0">
        <Card.Title className="type-heading-large">登录</Card.Title>
        <Card.Description>登录后进入工作台，查看项目动态与待办任务</Card.Description>
      </Card.Header>
      <Card.Content className="pt-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>{error}</Alert.Content>
            </Alert>
          ) : null}

          <TextField isRequired name="account">
            <Label>账号 / 手机 / 邮箱</Label>
            <InputGroup>
              <InputGroup.Input
                autoComplete="username"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </InputGroup>
          </TextField>

          <TextField isRequired name="password" type="password">
            <Label>密码</Label>
            <InputGroup>
              <InputGroup.Input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </InputGroup>
          </TextField>

          <Button className="w-full" isPending={loading} type="submit">
            登录
          </Button>
        </form>
      </Card.Content>
      <Card.Footer className="text-sm text-muted">
        还没有账号？{" "}
        <Link className="text-accent hover:underline" to="/member/register">
          注册
        </Link>
      </Card.Footer>
    </Card>
  );
}
