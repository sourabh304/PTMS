'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Meeting, MeetingInput } from './types';

export interface MeetingQuery {
  from: string;
  to: string;
  /** A project's meetings plus the organization-wide ones; omit for everything visible. */
  projectId?: string;
}

export const meetingKeys = {
  all: ['meetings'] as const,
  list: (query: MeetingQuery) => ['meetings', 'list', query] as const,
};

export function useMeetings(query: MeetingQuery, enabled = true) {
  return useQuery({
    queryKey: meetingKeys.list(query),
    queryFn: () => api.get<Meeting[]>('/meetings', { ...query }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

function useInvalidateMeetings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: meetingKeys.all });
}

export function useCreateMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: (input: MeetingInput) => api.post<Meeting>('/meetings', input),
    // The form shows errors inline, in its own words.
    meta: { successMessage: 'Meeting scheduled', silentError: true },
    onSuccess: invalidate,
  });
}

export function useUpdateMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<MeetingInput> & { id: string }) => api.patch<Meeting>(`/meetings/${id}`, input),
    // The form shows errors inline, in its own words.
    meta: { successMessage: 'Meeting updated', silentError: true },
    onSuccess: invalidate,
  });
}

export function useDeleteMeeting() {
  const invalidate = useInvalidateMeetings();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    meta: { successMessage: 'Meeting deleted' },
    onSuccess: invalidate,
  });
}
