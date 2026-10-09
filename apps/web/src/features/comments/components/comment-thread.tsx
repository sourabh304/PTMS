'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/features/auth/api';
import { fullName, timeAgo } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/feedback';
import { Textarea } from '@/shared/ui/form';
import { useAddComment, useComments, useDeleteComment, useUpdateComment, type CommentTarget } from '../api';

export function CommentThread({ target }: { target: CommentTarget }) {
  const { data: user } = useSession();
  const { data: comments, isLoading } = useComments(target);
  const add = useAddComment(target);
  const update = useUpdateComment(target);
  const remove = useDeleteComment(target);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);

  const submit = () => {
    const body = draft.trim();
    if (body) add.mutate(body, { onSuccess: () => setDraft('') });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Spinner />
      ) : !comments?.length ? (
        <p className="text-sm text-muted">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar user={comment.author} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{fullName(comment.author)}</span>
                  <span className="text-xs text-muted">
                    {timeAgo(comment.createdAt)}
                    {comment.updatedAt !== comment.createdAt && ' · edited'}
                  </span>
                  {comment.authorId === user?.id && editing?.id !== comment.id && (
                    <span className="ml-auto flex gap-1">
                      <button type="button" aria-label="Edit comment" title="Edit comment" onClick={() => setEditing({ id: comment.id, body: comment.body })} className="text-muted hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="Delete comment" title="Delete comment" onClick={() => remove.mutate(comment.id)} className="text-muted hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                {editing?.id === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea rows={3} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={update.isPending}
                        onClick={() => editing.body.trim() && update.mutate({ id: comment.id, body: editing.body.trim() }, { onSuccess: () => setEditing(null) })}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-muted px-3 py-2 text-sm">{comment.body}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        {user && <Avatar user={user} />}
        <div className="flex-1 space-y-2">
          <Textarea
            rows={2}
            placeholder="Write a comment… (Ctrl+Enter to send)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
            }}
          />
          <Button size="sm" onClick={submit} loading={add.isPending} disabled={!draft.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
