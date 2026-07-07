import { AdminSettingsGroupPage } from "@/pages/admin/AdminSettingsGroupPage";
import { Card } from "@heroui/react";

const SITE_USAGE = [
  { field: "站点名称 / 应用名称", where: "浏览器标题、侧栏 Logo 旁、登录页品牌区" },
  { field: "版本号", where: "页面底部 Footer" },
  { field: "版权信息", where: "页面底部 Footer" },
  { field: "备案号", where: "页面底部 Footer（链至 beian.miit.gov.cn）" },
  { field: "浏览器图标 URL", where: "浏览器 Tab 图标（favicon）" },
  { field: "百度统计 Key", where: "Legacy Vue 版注入统计脚本；Hero 版待接入" },
] as const;

export default function AdminSitePage() {
  return (
    <div className="space-y-4">
      <Card className="p-4 type-body text-subtle">
        <p className="font-medium text-foreground mb-2">这些配置在哪里生效？</p>
        <ul className="space-y-1.5 list-disc pl-5">
          {SITE_USAGE.map((row) => (
            <li key={row.field}>
              <span className="text-foreground">{row.field}</span>
              <span> → {row.where}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 type-hint">保存后刷新页面即可看到侧栏与 Footer 更新。</p>
      </Card>
      <AdminSettingsGroupPage groupId="site" />
    </div>
  );
}
