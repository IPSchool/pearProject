/** 登录页左侧展示图（src/assets/home，支持 jpg / png / webp 等混合格式） */
const imageModules = import.meta.glob<string>("@home/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const AUTH_HOME_IMAGE_URLS = Object.values(imageModules);

export function pickRandomAuthHomeImage(): string | null {
  if (AUTH_HOME_IMAGE_URLS.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * AUTH_HOME_IMAGE_URLS.length);
  return AUTH_HOME_IMAGE_URLS[index] ?? null;
}
