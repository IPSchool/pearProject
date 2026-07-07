import { isOk, post } from "@/api/client";

export type PublicSystemConfig = {
  app_name?: string;
  site_name?: string;
  app_version?: string;
  site_copy?: string;
  miitbeian?: string;
  browser_icon?: string;
};

export async function fetchPublicSystemConfig() {
  const res = await post<PublicSystemConfig>("project/index/systemConfig", {});
  if (!isOk(res)) throw new Error(res.msg || "加载站点信息失败");
  return res.data;
}
