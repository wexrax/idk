import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-[22px] font-bold tracking-normal text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

type PanelProps = ComponentPropsWithoutRef<"section"> & {
  compact?: boolean;
};

export function Panel({ children, className, compact = false, ...props }: PanelProps) {
  return (
    <section
      className={cn("admin-panel", compact ? "p-4" : "p-5", className)}
      {...props}
    >
      {children}
    </section>
  );
}

type SegmentedControlProps<T extends string> = {
  items: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
  value: T;
};

export function SegmentedControl<T extends string>({
  items,
  labels,
  onChange,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-[10px] border border-white/[0.06] bg-bg-elevated p-1">
      {items.map((item) => (
        <button
          className={cn(
            "admin-focus rounded-lg px-3 py-1.5 text-xs font-medium",
            value === item
              ? "admin-gradient text-white shadow-lg shadow-brand-primary/20"
              : "text-text-secondary hover:text-white",
          )}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {labels[item]}
        </button>
      ))}
    </div>
  );
}

type StatusChipTone = "danger" | "info" | "muted" | "success" | "warning" | "brand";

const statusToneClass: Record<StatusChipTone, string> = {
  brand: "border-brand-primary/30 bg-brand-primary/15 text-brand-primary",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
  muted: "border-white/[0.08] bg-white/5 text-text-secondary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export function StatusChip({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: StatusChipTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
        statusToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
