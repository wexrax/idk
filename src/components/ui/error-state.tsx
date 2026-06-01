import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  className?: string;
  message?: string;
  onRetry?: () => void;
  title?: string;
};

export function ErrorState({
  className,
  message = "Попробуйте обновить данные.",
  onRetry,
  title = "Не удалось загрузить дашборд",
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-start justify-center gap-3 rounded-md border border-danger/40 bg-danger/10 p-6 text-sm",
        className,
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 font-medium text-text-primary">
        <AlertTriangle aria-hidden className="h-4 w-4 text-danger" />
        {title}
      </div>
      <p className="text-text-secondary">{message}</p>
      {onRetry ? (
        <button
          className="admin-panel-elevated px-3 py-2 text-text-primary hover:bg-bg-overlay"
          onClick={onRetry}
          type="button"
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}
