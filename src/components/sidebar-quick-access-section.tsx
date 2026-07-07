import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

import { NavIcon } from "@/components/nav-icon";
import { BUILTIN_QUICK_ACCESS, mergeQuickAccessItems } from "@/lib/quick-access";
import { useQuickAccessStore } from "@/stores/quick-access";

interface SidebarQuickAccessSectionProps {
  collapsed: boolean;
}

export function SidebarQuickAccessSection({ collapsed }: SidebarQuickAccessSectionProps) {
  const location = useLocation();
  const pinned = useQuickAccessStore((s) => s.pinned);
  const remove = useQuickAccessStore((s) => s.remove);
  const items = useMemo(() => mergeQuickAccessItems(pinned), [pinned]);

  const userPinned = useMemo(
    () => pinned.filter((p) => !BUILTIN_QUICK_ACCESS.some((b) => b.id === p.id)),
    [pinned],
  );

  return (
    <div className={clsx("border-t border-separator", collapsed ? "px-2 py-2" : "px-3 py-3")}>
      {!collapsed ? (
        <p className="mb-2 px-3 type-hint text-subtlest">快捷入口</p>
      ) : null}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          const removable = userPinned.some((p) => p.id === item.id);

          if (collapsed) {
            return (
              <Link
                key={item.id}
                className={clsx(
                  "flex items-center justify-center rounded-md px-2 py-2.5 transition-colors",
                  active
                    ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
                    : "text-foreground hover:bg-[var(--ads-color-background-neutral)]",
                )}
                title={item.label}
                to={item.href}
              >
                <NavIcon className="shrink-0 opacity-85" href={item.href} label={item.label} />
              </Link>
            );
          }

          return (
            <div key={item.id} className="group flex items-center gap-0.5">
              <Link
                className={clsx(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-1.5 type-body transition-colors",
                  active
                    ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)] font-medium"
                    : "text-foreground hover:bg-[var(--ads-color-background-neutral)]",
                )}
                title={item.subtitle ?? item.label}
                to={item.href}
              >
                <NavIcon className="shrink-0 opacity-85" href={item.href} label={item.label} />
                <span className="truncate">{item.label}</span>
              </Link>
              {removable ? (
                <button
                  aria-label={`移除 ${item.label}`}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle opacity-0 transition-opacity hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground group-hover:opacity-100"
                  type="button"
                  onClick={() => remove(item.id)}
                >
                  ×
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
