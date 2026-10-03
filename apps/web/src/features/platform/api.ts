'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type {
  CreateOrganizationInput,
  PlatformOrganization,
  PlatformOrganizationDetail,
  PlatformOrganizationQuery,
  PlatformOverview,
} from './types';

export const platformKeys = {
  all: ['platform'] as const,
  overview: ['platform', 'overview'] as const,
  organizations: (query: PlatformOrganizationQuery) => ['platform', 'organizations', query] as const,
  organization: (id: string) => ['platform', 'organization', id] as const,
};

export function usePlatformOverview() {
  return useQuery({ queryKey: platformKeys.overview, queryFn: () => api.get<PlatformOverview>('/platform/overview') });
}

export function usePlatformOrganizations(query: PlatformOrganizationQuery) {
  return useQuery({
    queryKey: platformKeys.organizations(query),
    queryFn: () => api.get<Paginated<PlatformOrganization>>('/platform/organizations', { ...query }),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformOrganization(id: string | null) {
  return useQuery({
    queryKey: platformKeys.organization(id ?? ''),
    queryFn: () => api.get<PlatformOrganizationDetail>(`/platform/organizations/${id}`),
    enabled: !!id,
  });
}

function useInvalidatePlatform() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: platformKeys.all });
}

export function useCreateOrganization() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => api.post<PlatformOrganizationDetail>('/platform/organizations', input),
    meta: { successMessage: 'Organization created' },
    onSuccess: invalidate,
  });
}

export function useUpdatePlatformOrganization() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; isActive?: boolean }) =>
      api.patch<PlatformOrganizationDetail>(`/platform/organizations/${id}`, input),
    meta: { successMessage: 'Organization updated' },
    onSuccess: invalidate,
  });
}

export function useDeletePlatformOrganization() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/platform/organizations/${id}`),
    meta: { successMessage: 'Organization deleted' },
    onSuccess: invalidate,
  });
}
