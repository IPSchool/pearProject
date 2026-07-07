import { Outlet } from "react-router-dom";
import clsx from "clsx";

import { AppShellHeader } from "@/components/app-shell-header";
import { AppSidebar } from "@/components/app-sidebar";
import { AppFooter } from "@/components/app-footer";
import { AppRealtimeBootstrap } from "@/components/app-realtime-bootstrap";
import { AppSiteBootstrap } from "@/components/app-site-bootstrap";
import { useLayoutStore } from "@/stores/layout";

export default function AppLayout() {
  const focusMode = useLayoutStore((s) => s.focusMode);

  return (
    <div className="flex h-screen bg-surface text-foreground">
      <AppSiteBootstrap />
      <AppRealtimeBootstrap />
      {!focusMode ? <AppSidebar /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppShellHeader />
        <main
          className={clsx(
            "flex-1 overflow-auto bg-surface",
            focusMode ? "p-4 lg:p-6" : "p-4 lg:p-6",
          )}
        >
          <Outlet />
        </main>
        {!focusMode ? <AppFooter /> : null}
      </div>
    </div>
  );
}
