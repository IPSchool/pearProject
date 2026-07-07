import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";

import { fetchNoReads } from "@/api/notify";
import { MemberAvatar } from "@/components/member-avatar";
import { BellIcon, LogOutIcon, SettingsIcon } from "@/components/nav-icon";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuthStore } from "@/stores/auth";
import { useRealtimeStore } from "@/stores/realtime";

function formatBadgeCount(count: number) {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

function HeaderIconButton({
  label,
  children,
  badge,
  onPress,
  href,
}: {
  label: string;
  children: ReactNode;
  badge?: string | null;
  onPress?: () => void;
  href?: string;
}) {
  const className = clsx(
    "relative inline-flex size-9 items-center justify-center rounded-md",
    "text-foreground hover:bg-[var(--ads-color-background-neutral)] transition-colors",
  );

  const content = (
    <>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--ads-color-brand)] px-1 text-[0.625rem] font-semibold leading-4 text-white">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link aria-label={label} className={className} title={label} to={href}>
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-label={label}
      className={className}
      title={label}
      type="button"
      onClick={onPress}
    >
      {content}
    </button>
  );
}

export function AppHeaderActions() {
  const navigate = useNavigate();
  const member = useAuthStore((s) => s.member);
  const logout = useAuthStore((s) => s.logout);
  const notifyTick = useRealtimeStore((s) => s.notifyTick);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNoReads()
      .then((d) => setUnread(d.total ?? d.totalSum?.notice ?? 0))
      .catch(() => setUnread(0));
  }, [notifyTick]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const badge = formatBadgeCount(unread);

  return (
    <div className="flex items-center gap-1">
      <ThemeSwitch className="size-9 rounded-md hover:bg-[var(--ads-color-background-neutral)]" />

      <HeaderIconButton href="/settings" label="个人设置">
        <SettingsIcon className="size-[1.125rem]" />
      </HeaderIconButton>

      <HeaderIconButton badge={badge} href="/notifications" label="通知">
        <BellIcon className="size-[1.125rem]" />
      </HeaderIconButton>

      <div ref={menuRef} className="relative ml-1">
        <button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="用户菜单"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ads-color-brand)]"
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MemberAvatar className="size-8 cursor-pointer" name={member?.name} src={member?.avatar} />
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-separator bg-surface shadow-lg"
            role="menu"
          >
            <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
              <MemberAvatar name={member?.name} src={member?.avatar} />
              <div className="min-w-0">
                <p className="type-body font-medium truncate">{member?.name ?? "用户"}</p>
                <p className="type-hint truncate">{member?.email ?? member?.mobile ?? "—"}</p>
              </div>
            </div>
            <div className="p-1">
              <Link
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 type-body hover:bg-[var(--ads-color-background-neutral)]"
                role="menuitem"
                to="/settings"
                onClick={() => setMenuOpen(false)}
              >
                <SettingsIcon className="size-4 shrink-0 opacity-70" />
                个人设置
              </Link>
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 type-body text-left hover:bg-[var(--ads-color-background-neutral)]"
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate("/member/login");
                }}
              >
                <LogOutIcon className="size-4 shrink-0 opacity-70" />
                退出登录
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
