import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function Section({ children, className, description, title }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
