'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { AuthConfig, LoginInput, SessionUser } from './types';

export const authKeys = {
  session: ['auth', 'session'] as const,
  config: ['auth', 'config'] as const,
};

export const authApi = {
  config: () => api.get<AuthConfig>('/auth/config'),
  me: () => api.get<SessionUser>('/auth/me'),
  login: (input: LoginInput) => api.post<{ success: boolean }>('/auth/login', input, { skipAuthRefresh: true }),
  logout: () => api.post<void>('/auth/logout', undefined, { skipAuthRefresh: true }),
};

export function useSession() {
  return useQuery({ queryKey: authKeys.session, queryFn: authApi.me, staleTime: 60_000, retry: false });
}

export function useAuthConfig() {
  return useQuery({ queryKey: authKeys.config, queryFn: authApi.config, staleTime: Infinity });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    meta: { silentError: true },
    onSuccess: () => queryClient.clear(),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => queryClient.clear(),
  });
}
