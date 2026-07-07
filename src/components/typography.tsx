import clsx from "clsx";
import type { ReactNode } from "react";

type PageHeaderSize = "large" | "medium";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  size?: PageHeaderSize;
  className?: string;
}

const headingClass: Record<PageHeaderSize, string> = {
  large: "type-heading-large",
  medium: "type-heading-medium",
};

export function PageHeader({
  title,
  description,
  actions,
  size = "large",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className={headingClass[size]}>{title}</h1>
        {description ? (
          <p className="type-meta mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: SectionTitleProps) {
  return <Tag className={clsx("type-heading-small", className)}>{children}</Tag>;
}

interface MetaLabelProps {
  children: ReactNode;
  className?: string;
}

export function MetaLabel({ children, className }: MetaLabelProps) {
  return <span className={clsx("type-label", className)}>{children}</span>;
}
