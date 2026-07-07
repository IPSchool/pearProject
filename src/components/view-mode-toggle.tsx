import clsx from "clsx";

export type ViewMode = "card" | "list";

function CardGridIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function RowsIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-md border border-separator p-0.5",
        className,
      )}
      role="group"
      aria-label="显示方式"
    >
      <button
        aria-label="卡片视图"
        aria-pressed={value === "card"}
        className={clsx(
          "inline-flex size-8 items-center justify-center rounded transition-colors",
          value === "card"
            ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
            : "text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
        )}
        type="button"
        onClick={() => onChange("card")}
      >
        <CardGridIcon />
      </button>
      <button
        aria-label="列表视图"
        aria-pressed={value === "list"}
        className={clsx(
          "inline-flex size-8 items-center justify-center rounded transition-colors",
          value === "list"
            ? "bg-[var(--ads-color-background-selected)] text-[var(--ads-color-text-selected)]"
            : "text-subtle hover:bg-[var(--ads-color-background-neutral)] hover:text-foreground",
        )}
        type="button"
        onClick={() => onChange("list")}
      >
        <RowsIcon />
      </button>
    </div>
  );
}
