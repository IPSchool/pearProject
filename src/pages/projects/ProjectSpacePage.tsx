import { Link, useParams } from "react-router-dom";
import { Button, Card, Chip } from "@heroui/react";

const phases = [
  { title: "看板列 & 拖拽", phase: "Phase 3" },
  { title: "任务详情抽屉", phase: "Phase 3" },
  { title: "成员 / 文件 / 版本", phase: "Phase 4" },
  { title: "工作流 & 模板", phase: "Phase 5" },
];

export default function ProjectSpacePage() {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link className="hover:underline" to="/projects">
              项目
            </Link>
            {" / "}
            {code}
          </p>
          <h2 className="text-2xl font-semibold mt-1">任务看板</h2>
          <p className="text-muted mt-1">
            此处将重建 HistoryV 看板体验（参考原型，非代码迁移）
          </p>
        </div>
        <Button isDisabled variant="secondary">
          创建任务
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["待处理", "进行中", "已完成"].map((column) => (
          <Card key={column} className="p-4 min-h-64">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">{column}</p>
              <Chip size="sm" variant="soft">
                0
              </Chip>
            </div>
            <div className="rounded-lg border border-dashed border-separator p-6 text-center text-sm text-muted">
              看板占位
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <p className="font-medium mb-3">实现路线图</p>
        <ul className="space-y-2 text-sm text-muted">
          {phases.map((item) => (
            <li key={item.title} className="flex items-center gap-2">
              <Chip size="sm">{item.phase}</Chip>
              {item.title}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
