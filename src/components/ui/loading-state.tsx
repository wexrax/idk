import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  label?: string;
};

export function LoadingState({
  className,
  label = "Загрузка данных",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-64 items-center justify-center admin-panel p-6 text-sm text-text-secondary",
        className,
      )}
      role="status"
    >
      {label}
    </div>
  );
}
