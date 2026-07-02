import { Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useMemo } from "react";

import { PearLogo } from "@/components/pear-logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";
import { menuToNavRoutes } from "@/lib/menu";
import { useAuthStore } from "@/stores/auth";

export function AppSidebar() {
  const location = useLocation();
  const member = useAuthStore((s) => s.member);
  const menuList = useAuthStore((s) => s.menuList);
  const logout = useAuthStore((s) => s.logout);

  const navItems = useMemo(() => {
    const fromMenu = menuToNavRoutes(menuList);
    const extras = [
      { label: "项目模板", href: "/templates" },
      { label: "团队管理", href: "/team/organizations" },
      { label: "通知", href: "/notifications" },
      { label: "个人设置", href: "/settings" },
    ];
    const merged = [...fromMenu];
    for (const item of extras) {
      if (!merged.some((n) => n.href === item.href)) merged.push(item);
    }
    return merged;
  }, [menuList]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-separator bg-surface/40">
      <div className="flex items-center gap-2 border-b border-separator px-5 py-4">
        <PearLogo />
        <div>
          <p className="font-semibold leading-tight">{siteConfig.name}</p>
          <p className="text-xs text-muted">Hero · React</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={clsx(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-foreground hover:bg-default-100",
              )}
              to={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-separator p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">主题</span>
          <ThemeSwitch />
        </div>
        <div className="text-sm">
          <p className="font-medium truncate">{member?.name ?? "用户"}</p>
          <p className="text-xs text-muted truncate">{member?.email ?? member?.mobile}</p>
        </div>
        <Button className="w-full" size="sm" variant="tertiary" onPress={() => logout()}>
          退出登录
        </Button>
      </div>
    </aside>
  );
}
