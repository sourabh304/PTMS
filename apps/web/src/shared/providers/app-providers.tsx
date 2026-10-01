'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { ApiError, errorMessage } from '@/shared/lib/api-client';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Message shown on success. */
      successMessage?: string;
      /** Suppress the global error toast (the form shows the error inline). */
      silentError?: boolean;
    };
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage);
      },
      onError: (error, _variables, _context, mutation) => {
        if (!mutation.meta?.silentError) toast.error(errorMessage(error));
      },
    }),
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
