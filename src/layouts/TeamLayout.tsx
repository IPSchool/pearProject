import { Outlet } from "react-router-dom";

import { TeamTabs } from "@/components/team-tabs";

export default function TeamLayout() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">团队管理</h2>
      <TeamTabs />
      <Outlet />
    </div>
  );
}
