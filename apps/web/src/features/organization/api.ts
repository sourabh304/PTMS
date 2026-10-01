'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import { authKeys } from '@/features/auth/api';
import type { Organization, UpdateOrganizationInput } from './types';

export const organizationKeys = { current: ['organization'] as const };

export function useOrganization() {
  return useQuery({ queryKey: organizationKeys.current, queryFn: () => api.get<Organization>('/organization') });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => api.patch<Organization>('/organization', input),
    meta: { successMessage: 'Organization settings saved' },
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKeys.current, organization);
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}
