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
