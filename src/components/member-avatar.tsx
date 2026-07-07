import { Avatar } from "@heroui/react";

import { resolveMemberAvatarUrl } from "@/config/assets";

export function MemberAvatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const avatarSrc = resolveMemberAvatarUrl(src);
  return (
    <Avatar className={className}>
      <Avatar.Image alt={name ?? "用户头像"} src={avatarSrc} />
      <Avatar.Fallback>{initial}</Avatar.Fallback>
    </Avatar>
  );
}
