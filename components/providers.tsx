"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { defaultQueryOptions, retryConfig } from "@/lib/query/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: defaultQueryOptions.staleTime,
            refetchOnWindowFocus: true, // Keep data fresh when user returns
            refetchOnReconnect: true, // Refresh after network reconnect
            retry: retryConfig.default.retry,
            retryDelay: retryConfig.default.retryDelay,
          },
          mutations: {
            retry: 1, // Single retry for mutations
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
