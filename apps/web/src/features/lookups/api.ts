'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { LookupType } from '@/shared/constants/domain';
import { api } from '@/shared/lib/api-client';
import type { Lookup, LookupInput } from './types';

export const lookupKeys = { all: ['lookups'] as const };

/** All configurable lookups for the organization, cached once and filtered client-side. */
export function useAllLookups() {
  return useQuery({ queryKey: lookupKeys.all, queryFn: () => api.get<Lookup[]>('/lookups'), staleTime: 5 * 60_000 });
}

export function useLookups(type: LookupType) {
  const query = useAllLookups();
  const data = useMemo(
    () => (query.data ?? []).filter((lookup) => lookup.type === type).sort((a, b) => a.position - b.position),
    [query.data, type],
  );
  return { ...query, data };
}

function useLookupMutation<TVariables>(fn: (variables: TVariables) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    meta: { successMessage },
    // Statuses/priorities are embedded in many resources: refresh everything.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export const useCreateLookup = () => useLookupMutation((input: LookupInput) => api.post<Lookup>('/lookups', input), 'Value added');

export const useUpdateLookup = () =>
  useLookupMutation(
    ({ id, ...input }: Partial<Omit<LookupInput, 'type'>> & { id: string }) => api.patch<Lookup>(`/lookups/${id}`, input),
    'Value updated',
  );

export const useDeleteLookup = () =>
  useLookupMutation(
    ({ id, replacementId }: { id: string; replacementId?: string }) => api.delete(`/lookups/${id}`, { replacementId }),
    'Value deleted',
  );

export const useReorderLookups = () =>
  useLookupMutation(({ type, ids }: { type: LookupType; ids: string[] }) => api.patch<Lookup[]>('/lookups/reorder', { type, ids }), 'Order saved');
