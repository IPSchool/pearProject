import { apiBaseUrl } from "@/config/env";

/** 系统静态资源（对应 public/static/assets/system/） */
export const DEFAULT_MEMBER_AVATAR = "/static/assets/system/default-avatar.png";
export const DEFAULT_PROJECT_COVER = "/static/assets/system/default-project-cover.jpg";

const LEGACY_DEFAULT_AVATAR = /static\.vilson\.(xyz|online)\/cover\.png/i;
const LEGACY_DEFAULT_PROJECT_COVER =
  /(?:easyproject\.net|\/)static\/image\/default\/(?:project-)?cover\.png/i;
const LEGACY_VILSON_HOST =
  /(?:^https?:\/\/)?(?:beta\.|static\.)?vilson\.(?:xyz|online)(?:[:/]|$)/i;

const SYSTEM_DEFAULT_AVATAR = /\/static\/assets\/system\/default-avatar\.png$/i;
const SYSTEM_DEFAULT_PROJECT_COVER =
  /\/static\/assets\/system\/default-project-cover\.jpg$/i;

function assetPathname(src: string): string {
  try {
    if (/^https?:\/\//i.test(src)) {
      return new URL(src).pathname.replace(/\/{2,}/g, "/");
    }
  } catch {
    // ignore malformed URL
  }
  return src.startsWith("/") ? src.replace(/\/{2,}/g, "/") : `/${src}`.replace(/\/{2,}/g, "/");
}

function isLegacyVilsonUrl(src: string): boolean {
  return LEGACY_VILSON_HOST.test(src);
}

/** 演示库中指向已下线 vilson 域名的资源，回落到本地默认图 */
function isLegacyRemoteAsset(src: string): boolean {
  return (
    isLegacyVilsonUrl(src) ||
    LEGACY_DEFAULT_AVATAR.test(src) ||
    LEGACY_DEFAULT_PROJECT_COVER.test(src)
  );
}

/** 将 API 返回的 /static/upload 相对路径接到当前 API 基址（开发环境走 Vite /api 代理） */
function rewriteLocalUploadPath(src: string): string {
  const path = assetPathname(src);
  if (!path.startsWith("/static/upload/")) {
    return src;
  }
  const base = apiBaseUrl();
  return base ? `${base}${path}` : path;
}

/** 无头像或仍为 Legacy / 系统默认图时，使用本地系统默认头像 */
export function resolveMemberAvatarUrl(src?: string | null): string {
  const trimmed = src?.trim();
  if (!trimmed || isLegacyRemoteAsset(trimmed)) {
    return DEFAULT_MEMBER_AVATAR;
  }
  const path = assetPathname(trimmed);
  if (path === DEFAULT_MEMBER_AVATAR || SYSTEM_DEFAULT_AVATAR.test(path)) {
    return DEFAULT_MEMBER_AVATAR;
  }
  if (path.startsWith("/static/upload/")) {
    return rewriteLocalUploadPath(trimmed);
  }
  return trimmed;
}

/**
 * 无封面或仍为 Legacy / 系统默认图时，使用本地系统默认项目封面。
 * 新建项目 API 会写入带 API 域名的默认封面 URL，此处统一回落到前端 public 静态资源。
 */
export function resolveProjectCoverUrl(src?: string | null): string {
  const trimmed = src?.trim();
  if (!trimmed || isLegacyRemoteAsset(trimmed)) {
    return DEFAULT_PROJECT_COVER;
  }
  const path = assetPathname(trimmed);
  if (path === DEFAULT_PROJECT_COVER || SYSTEM_DEFAULT_PROJECT_COVER.test(path)) {
    return DEFAULT_PROJECT_COVER;
  }
  if (path.startsWith("/static/upload/")) {
    return rewriteLocalUploadPath(trimmed);
  }
  return trimmed;
}

/** 旧版富文本里嵌入的 vilson 外链图片（演示数据），避免请求已下线域名 */
export function stripLegacyHtmlImages(html: string): string {
  return html.replace(
    /<img\b[^>]*\bsrc=["']https?:\/\/(?:beta\.|static\.)?vilson\.(?:xyz|online)[^"']*["'][^>]*>/gi,
    "",
  );
}
