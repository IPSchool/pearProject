import { Outlet } from "react-router-dom";

import { AdminTabs } from "@/components/admin-tabs";
import { PageHeader } from "@/components/typography";

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        className="mb-4"
        description="管理站点、邮件、存储引擎与 AI 能力等实例级配置。仅组织拥有者可见。"
        title="系统设置"
      />
      <AdminTabs />
      <Outlet />
    </div>
  );
}
