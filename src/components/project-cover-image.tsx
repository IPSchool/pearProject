import { resolveProjectCoverUrl } from "@/config/assets";

export function ProjectCoverImage({
  cover,
  className = "h-28 w-full object-cover",
  alt = "",
}: {
  cover?: string | null;
  className?: string;
  alt?: string;
}) {
  return <img alt={alt} className={className} src={resolveProjectCoverUrl(cover)} />;
}
