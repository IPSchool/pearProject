import { create } from "zustand";

import { fetchPublicSystemConfig, type PublicSystemConfig } from "@/api/system";
import { siteConfig as staticSiteConfig } from "@/config/site";

type SitePublicState = {
  loaded: boolean;
  config: PublicSystemConfig | null;
  load: () => Promise<void>;
  displayName: () => string;
  version: () => string;
  copyright: () => string;
  icp: () => string;
  favicon: () => string;
};

export const useSitePublicStore = create<SitePublicState>((set, get) => ({
  loaded: false,
  config: null,

  async load() {
    try {
      const config = await fetchPublicSystemConfig();
      set({ config, loaded: true });
      applyDocumentMeta(config);
    } catch {
      set({ loaded: true });
    }
  },

  displayName() {
    const c = get().config;
    return c?.site_name?.trim() || c?.app_name?.trim() || staticSiteConfig.name;
  },

  version() {
    return get().config?.app_version?.trim() || "";
  },

  copyright() {
    return get().config?.site_copy?.trim() || "";
  },

  icp() {
    return get().config?.miitbeian?.trim() || "";
  },

  favicon() {
    return get().config?.browser_icon?.trim() || "";
  },
}));

function applyDocumentMeta(config: PublicSystemConfig) {
  const title = config.site_name?.trim() || config.app_name?.trim();
  if (title) {
    document.title = title;
  }
  const icon = config.browser_icon?.trim();
  if (icon) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = icon;
  }
}
