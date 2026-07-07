import { Link, Outlet } from "react-router-dom";

import { AuthHeroAside } from "@/components/auth-hero-aside";
import { AppSiteBootstrap } from "@/components/app-site-bootstrap";
import { PearLogo } from "@/components/pear-logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { useSitePublicStore } from "@/stores/site-public";

export default function AuthLayout() {
  const displayName = useSitePublicStore((s) => s.displayName());
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AppSiteBootstrap />
      <AuthHeroAside />

      <section className="flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeSwitch />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <PearLogo />
              <p className="type-heading-medium">{displayName}</p>
            </div>
            <Outlet />
            <p className="mt-8 text-center type-hint">
              <Link className="text-accent hover:underline" to="/member/login">
                登录
              </Link>
              {" · "}
              <Link className="text-accent hover:underline" to="/member/register">
                注册
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
