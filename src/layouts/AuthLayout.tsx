import { Link, Outlet } from "react-router-dom";

import { PearLogo } from "@/components/pear-logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-accent/10 p-12">
        <div className="flex items-center gap-3">
          <PearLogo size={40} />
          <div>
            <p className="type-heading-large">{siteConfig.name}</p>
            <p className="type-meta">{siteConfig.description}</p>
          </div>
        </div>
        <p className="max-w-md type-body text-subtle leading-relaxed">
          Hero 分支使用 React 19 + HeroUI v3 从零重建。Vue 2 原型见{" "}
          <code className="rounded bg-background/60 px-1">HistoryV</code> 分支，产品设计见
          pearProjectDocs。
        </p>
      </section>

      <section className="flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeSwitch />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <PearLogo />
              <p className="type-heading-medium">{siteConfig.name}</p>
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
