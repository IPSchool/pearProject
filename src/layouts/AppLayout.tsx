import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { WsStatusBadge } from "@/components/ws-status-badge";
import { appTitle } from "@/config/env";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-separator px-6">
          <h1 className="text-sm font-medium text-muted">{appTitle}</h1>
          <div className="flex items-center gap-3">
            <WsStatusBadge />
            <OrganizationSwitcher />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
