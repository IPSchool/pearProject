import type { MenuItem } from "@/types/api";

export interface NavRoute {
  label: string;
  href: string;
  disabled?: boolean;
}

/** Map Legacy menu file_path / url to Hero routes we implement. */
const PATH_TO_ROUTE: Record<string, string> = {
  home: "/workbench",
  "project/list": "/projects",
  "project/list/index": "/projects",
};

function resolveHref(item: MenuItem): string | null {
  const key = (item.file_path || item.url || "").replace(/^\/+/, "").toLowerCase();
  if (PATH_TO_ROUTE[key]) return PATH_TO_ROUTE[key];
  if (key === "home" || item.title === "工作台") return "/workbench";
  if (item.title?.includes("项目列表")) return "/projects";
  return null;
}

/** Build sidebar entries from backend menu tree (top-level + one child level). */
export function menuToNavRoutes(menuList: MenuItem[]): NavRoute[] {
  const routes: NavRoute[] = [];
  const seen = new Set<string>();

  function walk(items: MenuItem[]) {
    for (const item of items) {
      const href = resolveHref(item);
      if (href && !seen.has(href)) {
        seen.add(href);
        routes.push({ label: item.title, href });
      }
      if (item.children?.length) {
        walk(item.children);
      }
    }
  }

  walk(menuList);

  if (!routes.length) {
    return [
      { label: "工作台", href: "/workbench" },
      { label: "项目", href: "/projects" },
    ];
  }

  return routes;
}
