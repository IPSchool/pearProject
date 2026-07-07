import clsx from "clsx";

type ProjectStarButtonProps = {
  collected?: boolean;
  className?: string;
  size?: "sm" | "md";
  onPress: () => void;
  label?: string;
};

export function ProjectStarButton({
  collected,
  className,
  size = "md",
  onPress,
  label,
}: ProjectStarButtonProps) {
  const dim = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-4" : "size-[1.125rem]";

  return (
    <button
      aria-label={label ?? (collected ? "取消收藏" : "加入收藏")}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
        "hover:bg-[var(--ads-color-background-neutral)]",
        dim,
        className,
      )}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
    >
      <StarGlyph className={icon} filled={Boolean(collected)} />
    </button>
  );
}

export function StarGlyph({
  filled,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  if (filled) {
    return (
      <svg
        aria-hidden
        className={clsx("text-[#ffab00]", className)}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2.5 15.1 9.5 22.5 10.4 17 15.2 18.5 22.5 12 18.8 5.5 22.5 7 15.2 1.5 10.4 8.9 9.5 12 2.5Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      className={clsx("text-subtlest", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M12 3.5 14.6 9l5.9.5-4.5 3.8 1.4 5.7L12 16.8 6.6 19l1.4-5.7L3.5 9.5 9.4 9 12 3.5Z" />
    </svg>
  );
}

export function ProjectGlyph({
  name,
  cover,
  className,
}: {
  name: string;
  cover?: string;
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();

  if (cover) {
    return (
      <img
        alt=""
        className={clsx("rounded object-cover bg-surface-sunken", className)}
        src={cover}
      />
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded bg-[var(--ads-color-background-selected)]",
        "type-body-small font-semibold text-[var(--ads-color-text-selected)]",
        className,
      )}
    >
      {initial}
    </span>
  );
}
