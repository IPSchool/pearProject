export type NavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "PearProject",
  description: "梨子项目管理系统 — 团队协作与项目看板",
  navItems: [
    { label: "工作台", href: "/workbench" },
    { label: "项目", href: "/projects" },
    { label: "日程", href: "/calendar", disabled: true },
    { label: "团队", href: "/team", disabled: true },
  ] satisfies NavItem[],
  links: {
    docs: "https://github.com/a54552239/pearProjectDocs",
    github: "https://github.com/a54552239/pearProject",
    api: "https://github.com/a54552239/pearProjectApi",
  },
};
