import { Avatar } from "@heroui/react";

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
  return (
    <Avatar className={className}>
      {src ? <Avatar.Image src={src} /> : null}
      <Avatar.Fallback>{initial}</Avatar.Fallback>
    </Avatar>
  );
}
