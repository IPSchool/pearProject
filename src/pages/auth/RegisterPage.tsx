import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "@heroui/react";

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <Card className="p-6 shadow-surface">
      <Card.Header className="flex flex-col items-start gap-1 pb-0">
        <Card.Title className="text-2xl">注册</Card.Title>
        <Card.Description>账户模块将在 Phase 2 实现</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4 pt-6">
        <p className="text-sm text-muted leading-relaxed">
          当前 Hero 分支聚焦登录、工作台与项目列表骨架。注册、找回密码、第三方登录等能力请参考
          HistoryV 原型与 pearProjectDocs 功能设计文档。
        </p>
        <Button className="w-full" variant="tertiary" onPress={() => navigate("/member/login")}>
          返回登录
        </Button>
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
