import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useMemo } from "react";

import { NavIcon, SidebarPanelIcon } from "@/components/nav-icon";
import { PearLogo } from "@/components/pear-logo";
import { SidebarQuickAccessSection } from "@/components/sidebar-quick-access-section";
import { SidebarStarredSection } from "@/components/sidebar-starred-section";
import { siteConfig } from "@/config/site";
import { menuToNavRoutes } from "@/lib/menu";
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";

export function AppSidebar() {
  const location = useLocation();
  const menuList = useAuthStore((s) => s.menuList);
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);

  const navItems = useMemo(() => {
    const fromMenu = menuToNavRoutes(menuList);
    const extras = [
      { label: "我的任务", href: "/my-tasks" },
      { label: "回收站", href: "/recycle" },
      { label: "归档", href: "/archive" },
      { label: "日程", href: "/events" },
      { label: "数据分析", href: "/analytics" },
      { label: "项目模板", href: "/templates" },
      { label: "团队管理", href: "/team/members" },
    ];
    const merged = [...fromMenu];
    for (const item of extras) {
      if (!merged.some((n) => n.href === item.href)) merged.push(item);
    }
    return merged;
  }, [menuList]);

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <aside
      className={clsx(
        "flex h-full shrink-0 flex-col border-r border-separator bg-surface transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={clsx(
          "flex h-12 items-center border-b border-separator",
          collapsed ? "justify-center px-2" : "gap-1 px-3",
        )}
      >
        {!collapsed ? (
          <>
            <Link
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 pr-1 hover:opacity-90"
              title={siteConfig.name}
              to="/workbench"
            >
              <PearLogo />
              <span className="type-heading-xsmall truncate">{siteConfig.name}</span>
            </Link>
            <button
              aria-label="收起侧栏"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground"
              title="收起侧栏"
              type="button"
              onClick={toggleSidebar}
            >
              <SidebarPanelIcon className="size-[1.125rem]" />
            </button>
          </>
        ) : (
          <Link aria-label={siteConfig.name} title={siteConfig.name} to="/workbench">
            <PearLogo />
          </Link>
        )}
      </div>

      <nav className={clsx("flex-1 space-y-0.5 overflow-y-auto", collapsed ? "p-2" : "p-2")}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={clsx(
                "flex items-center rounded-md type-body transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                active
                  ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)] font-medium"
                  : "text-foreground hover:bg-[var(--ads-color-background-neutral)]",
              )}
              title={item.label}
              to={item.href}
            >
              <NavIcon className="shrink-0 opacity-85" href={item.href} label={item.label} />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <SidebarQuickAccessSection collapsed={collapsed} />
      <SidebarStarredSection collapsed={collapsed} sidebarWidth={sidebarWidth} />
    </aside>
  );
}
