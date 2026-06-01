import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  detail?: ReactNode;
  icon?: LucideIcon;
  label: string;
  meta?: ReactNode;
  tone?: "default" | "danger";
  trend?: Trend;
  value: string;
};

const trendIcon = {
  down: ArrowDownRight,
  flat: ArrowRight,
  up: ArrowUpRight,
};

export function MetricCard({
  detail,
  icon: Icon,
  label,
  meta,
  tone = "default",
  trend = "flat",
  value,
}: MetricCardProps) {
  const TrendIcon = trendIcon[trend];

  return (
    <article
      className={cn(
        "admin-panel admin-focus min-h-[132px] overflow-hidden p-4 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-brand-primary/10",
        tone === "danger" && "border-danger/40 bg-danger/10 shadow-danger/10",
      )}
    >
      <div className="relative flex h-full flex-col justify-between gap-3">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-brand-primary/10 blur-2xl",
            label === "MRR" && "bg-success/10",
            tone === "danger" && "bg-danger/15",
            label === "LTV:CAC" && "bg-info/10",
          )}
        />
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-bg-elevated text-brand-primary shadow-sm shadow-black/20",
            label === "MRR" && "bg-success/10 text-success",
            tone === "danger" && "bg-danger/10 text-danger",
            label === "LTV:CAC" && "bg-info/10 text-info",
          )}
        >
          {Icon ? <Icon aria-hidden className="h-3.5 w-3.5" /> : <TrendIcon aria-hidden className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0">
          <p className="max-w-[10rem] text-xs font-medium leading-4 text-text-secondary">{label}</p>
          <p className="mt-1 text-[23px] font-extrabold leading-none tracking-normal text-white">{value}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {detail ? (
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] font-bold",
                  trend === "up" && tone !== "danger" && "text-success",
                  trend === "down" && "text-danger",
                  tone === "danger" && "text-danger",
                )}
              >
                <TrendIcon aria-hidden className="h-3 w-3" />
                {detail}
              </div>
            ) : null}
            {meta ? <div className="text-[10px] font-medium leading-4 text-text-disabled">{meta}</div> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
