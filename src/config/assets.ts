/** 系统静态资源（对应 public/static/assets/system/） */
export const DEFAULT_MEMBER_AVATAR = "/static/assets/system/default-avatar.png";
export const DEFAULT_PROJECT_COVER = "/static/assets/system/default-project-cover.jpg";

const LEGACY_DEFAULT_AVATAR = /static\.vilson\.(xyz|online)\/cover\.png/i;
const LEGACY_DEFAULT_PROJECT_COVER =
  /(?:easyproject\.net|\/)static\/image\/default\/(?:project-)?cover\.png/i;

const SYSTEM_DEFAULT_AVATAR = /\/static\/assets\/system\/default-avatar\.png$/i;
const SYSTEM_DEFAULT_PROJECT_COVER =
  /\/static\/assets\/system\/default-project-cover\.jpg$/i;

function assetPathname(src: string): string {
  try {
    if (/^https?:\/\//i.test(src)) {
      return new URL(src).pathname;
    }
  } catch {
    // ignore malformed URL
  }
  return src.startsWith("/") ? src : `/${src}`;
}

/** 无头像或仍为 Legacy / 系统默认图时，使用本地系统默认头像 */
export function resolveMemberAvatarUrl(src?: string | null): string {
  const trimmed = src?.trim();
  if (!trimmed || LEGACY_DEFAULT_AVATAR.test(trimmed)) {
    return DEFAULT_MEMBER_AVATAR;
  }
  const path = assetPathname(trimmed);
  if (path === DEFAULT_MEMBER_AVATAR || SYSTEM_DEFAULT_AVATAR.test(path)) {
    return DEFAULT_MEMBER_AVATAR;
  }
  return trimmed;
}

/**
 * 无封面或仍为 Legacy / 系统默认图时，使用本地系统默认项目封面。
 * 新建项目 API 会写入带 API 域名的默认封面 URL，此处统一回落到前端 public 静态资源。
 */
export function resolveProjectCoverUrl(src?: string | null): string {
  const trimmed = src?.trim();
  if (!trimmed || LEGACY_DEFAULT_PROJECT_COVER.test(trimmed)) {
    return DEFAULT_PROJECT_COVER;
  }
  const path = assetPathname(trimmed);
  if (path === DEFAULT_PROJECT_COVER || SYSTEM_DEFAULT_PROJECT_COVER.test(path)) {
    return DEFAULT_PROJECT_COVER;
  }
  return trimmed;
}
