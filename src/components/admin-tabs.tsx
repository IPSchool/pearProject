import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const tabs = [
  { label: "站点信息", href: "/admin/site" },
  { label: "组织模式", href: "/admin/organization" },
  { label: "文件存储", href: "/admin/storage" },
  { label: "邮件 / SMTP", href: "/admin/mail" },
  { label: "AI / LLM", href: "/admin/llm" },
] as const;

export function AdminTabs() {
  const location = useLocation();
  return (
    <div className="flex gap-1 border-b border-separator mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            className={clsx(
              "type-body px-4 py-2.5 -mb-px border-b-2 transition-colors whitespace-nowrap",
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
