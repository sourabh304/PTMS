'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { UserSummary } from '@/shared/types/api';

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
}

export type CommentTarget = { taskId: string; issueId?: never } | { issueId: string; taskId?: never };

export const commentKeys = {
  list: (target: CommentTarget) => ['comments', target.taskId ?? target.issueId] as const,
};

export function useComments(target: CommentTarget) {
  return useQuery({ queryKey: commentKeys.list(target), queryFn: () => api.get<Comment[]>('/comments', { ...target }) });
}

export function useAddComment(target: CommentTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Comment>('/comments', { ...target, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(target) }),
  });
}

export function useUpdateComment(target: CommentTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.patch<Comment>(`/comments/${id}`, { body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(target) }),
  });
}

export function useDeleteComment(target: CommentTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(target) }),
  });
}
