import clsx from "clsx";
import { useMemo } from "react";
import { Button } from "@heroui/react";

import type { QuickAccessKind } from "@/lib/quick-access";
import { isQuickAccessPinned } from "@/lib/quick-access";
import { useQuickAccessStore } from "@/stores/quick-access";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="m15 14 5 5M9.5 3.5 4 9l2 2 5.5-5.5L9.5 3.5ZM14 8l-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function AddToQuickAccessButton({
  label,
  href,
  kind = "page",
  subtitle,
  variant = "button",
  className,
}: {
  label: string;
  href: string;
  kind?: QuickAccessKind;
  subtitle?: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const pinned = useQuickAccessStore((s) => s.pinned);
  const toggle = useQuickAccessStore((s) => s.toggle);
  const pinnedState = useMemo(
    () => isQuickAccessPinned(href, pinned),
    [href, pinned],
  );

  function handlePress() {
    toggle({ label, href, kind, subtitle });
  }

  if (variant === "icon") {
    return (
      <button
        aria-label={pinnedState ? "从快捷入口移除" : "钉到快捷入口"}
        className={clsx(
          "inline-flex size-8 items-center justify-center rounded-md transition-colors",
          pinnedState
            ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
            : "text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
          className,
        )}
        title={pinnedState ? "已钉选 · 点击移除" : "钉到快捷入口"}
        type="button"
        onClick={handlePress}
      >
        <PinIcon className="size-4" />
      </button>
    );
  }

  return (
    <Button
      className={className}
      size="sm"
      variant={pinnedState ? "secondary" : "tertiary"}
      onPress={handlePress}
    >
      {pinnedState ? "已钉选" : "钉到快捷入口"}
    </Button>
  );
}
