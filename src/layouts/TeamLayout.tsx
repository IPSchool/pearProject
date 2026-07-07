import { Outlet } from "react-router-dom";

import { TeamTabs } from "@/components/team-tabs";
import { PageHeader } from "@/components/typography";

export default function TeamLayout() {
  return (
    <div>
      <PageHeader className="mb-4" title="团队管理" />
      <TeamTabs />
      <Outlet />
    </div>
  );
}
