import { describe, expect, it } from "vitest";

import { menuToNavRoutes } from "@/lib/menu";
import type { MenuItem } from "@/types/api";

describe("menuToNavRoutes", () => {
  it("maps 工作台 and 项目列表 from legacy menu", () => {
    const menu: MenuItem[] = [
      { id: 1, title: "工作台", url: "home", file_path: "home" },
      {
        id: 2,
        title: "项目管理",
        url: "#",
        children: [
          { id: 3, title: "项目列表", url: "#", file_path: "project/list" },
        ],
      },
    ];
    const routes = menuToNavRoutes(menu);
    expect(routes).toEqual(
      expect.arrayContaining([
        { label: "工作台", href: "/workbench" },
        { label: "项目列表", href: "/projects" },
      ]),
    );
  });

  it("falls back to defaults when menu empty", () => {
    expect(menuToNavRoutes([])).toHaveLength(2);
  });
});
