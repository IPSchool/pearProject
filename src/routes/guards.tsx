import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "@/stores/auth";

export function ProtectedRoute() {
  const logged = useAuthStore((s) => s.logged);
  const location = useLocation();

  if (!logged) {
    return <Navigate replace state={{ from: location }} to="/member/login" />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const logged = useAuthStore((s) => s.logged);

  if (logged) {
    return <Navigate replace to="/workbench" />;
  }

  return <Outlet />;
}

/** 仅组织拥有者（系统配置管理员） */
export function OwnerRoute() {
  const logged = useAuthStore((s) => s.logged);
  const isOwner = useAuthStore((s) => (s.member?.is_owner ?? 0) === 1);
  const location = useLocation();

  if (!logged) {
    return <Navigate replace state={{ from: location }} to="/member/login" />;
  }
  if (!isOwner) {
    return <Navigate replace to="/workbench" />;
  }

  return <Outlet />;
}
