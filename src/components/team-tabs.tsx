import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const tabs = [
  { label: "组织", href: "/team/organizations" },
  { label: "团队成员", href: "/team/members" },
  { label: "系统账号", href: "/team/accounts" },
  { label: "角色权限", href: "/team/roles" },
] as const;

export function TeamTabs() {
  const location = useLocation();
  return (
    <div className="flex gap-1 border-b border-separator mb-6">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            className={clsx(
              "type-body px-4 py-2.5 -mb-px border-b-2 transition-colors",
              active
                ? "border-[var(--ads-color-brand)] text-[var(--ads-color-text-selected)] font-medium"
                : "border-transparent text-subtle hover:text-foreground",
            )}
            to={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
