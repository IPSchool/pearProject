import { useEffect } from "react";

import { useSitePublicStore } from "@/stores/site-public";

/** 注入百度统计（tongji_baidu_key 由后端配置，此处预留；公开 API 未暴露 key 时需在 Index 扩展） */
export function AppSiteBootstrap() {
  const load = useSitePublicStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return null;
}
