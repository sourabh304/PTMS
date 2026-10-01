'use client';

import { useQuery } from '@tanstack/react-query';
import { appConfig } from '@/shared/config/env';
import { api } from '@/shared/lib/api-client';

/** Polls the public API health endpoint for the sidebar status indicator. */
export function useSystemStatus() {
  const query = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => api.get<{ status: string; database: string }>('/health'),
    refetchInterval: appConfig.healthPollMs,
    retry: false,
  });
  const operational = query.data?.status === 'ok';
  return { operational, checking: query.isLoading };
}
