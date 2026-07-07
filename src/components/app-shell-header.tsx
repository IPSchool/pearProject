import clsx from "clsx";
import { Link } from "react-router-dom";

import { AppCreateMenu } from "@/components/app-create-menu";
import { AppGlobalSearch } from "@/components/app-global-search";
import { AppHeaderActions } from "@/components/app-header-actions";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { PearLogo } from "@/components/pear-logo";
import {
  MaximizeIcon,
  MinimizeIcon,
  SidebarPanelIcon,
} from "@/components/nav-icon";
import { WsStatusBadge } from "@/components/ws-status-badge";
import { siteConfig } from "@/config/site";
import { useLayoutStore } from "@/stores/layout";

function ShellIconButton({
  label,
  pressed,
  onPress,
  children,
}: {
  label: string;
  pressed?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className={clsx(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
        pressed
          ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
          : "text-foreground hover:bg-[var(--ads-color-background-neutral)]",
      )}
      title={label}
      type="button"
      onClick={onPress}
    >
      {children}
    </button>
  );
}

export function AppShellHeader() {
  const focusMode = useLayoutStore((s) => s.focusMode);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const toggleFocusMode = useLayoutStore((s) => s.toggleFocusMode);

  const showSidebarToggle = focusMode || sidebarCollapsed;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-separator bg-surface px-3 lg:px-4">
      <div className="flex shrink-0 items-center gap-1">
        {showSidebarToggle ? (
          <ShellIconButton
            label={focusMode ? "显示侧栏" : sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
            onPress={() => {
              if (focusMode) {
                useLayoutStore.getState().setFocusMode(false);
                useLayoutStore.getState().setSidebarCollapsed(false);
              } else {
                toggleSidebar();
              }
            }}
          >
            <SidebarPanelIcon className="size-[1.125rem]" />
          </ShellIconButton>
        ) : null}

        {focusMode ? (
          <Link
            aria-label={siteConfig.name}
            className="hidden items-center gap-2 rounded-md px-1.5 py-1 hover:bg-[var(--ads-color-background-neutral)] sm:flex"
            title={siteConfig.name}
            to="/workbench"
          >
            <PearLogo />
          </Link>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <AppGlobalSearch />
        <AppCreateMenu />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ShellIconButton
          label={focusMode ? "退出全屏" : "全屏专注"}
          pressed={focusMode}
          onPress={toggleFocusMode}
        >
          {focusMode ? (
            <MinimizeIcon className="size-[1.125rem]" />
          ) : (
            <MaximizeIcon className="size-[1.125rem]" />
          )}
        </ShellIconButton>

        <div className="hidden md:flex md:items-center md:gap-2">
          <WsStatusBadge compact />
          <OrganizationSwitcher compact />
        </div>

        <span aria-hidden className="mx-1 hidden h-5 w-px bg-separator md:block" />
        <AppHeaderActions />
      </div>
    </header>
  );
}
