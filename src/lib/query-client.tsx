"use client";

import { toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

type ApiError = {
  code?: string;
  message?: string;
  request_id?: string;
  status?: number;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError(error) {
          const err = error as ApiError;

          const notify =
            err.code === "FORBIDDEN" ? toast.warning : toast.danger;

          notify(err.message ?? "Неизвестная ошибка", {
            description: err.request_id ? `ID: ${err.request_id}` : undefined,
          });
        },
      },
      queries: {
        retry(failureCount, error) {
          const err = error as ApiError;
          if (err.status === 401 || err.status === 403 || err.status === 404) {
            return false;
          }

          return failureCount < 1;
        },
        staleTime: 60_000,
      },
    },
  });
}

function ExtensionErrorGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const ignoredExtensionId = "nkbihfbeogaeaoehlefnkodbefgpgknn";
    const handleError = (event: ErrorEvent) => {
      if (
        event.filename?.includes(ignoredExtensionId) ||
        event.message.includes("Failed to connect to MetaMask")
      ) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason?.message ?? "";

      if (
        message.includes("Failed to connect to MetaMask") ||
        message.includes(ignoredExtensionId)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ExtensionErrorGuard>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ExtensionErrorGuard>
  );
}
