import { cn, fullName, initials } from '@/shared/lib/utils';

interface AvatarUser {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

const sizes = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-16 text-lg' } as const;

/** Muted, accessible hues; initials avatars get a stable color per person. */
const PALETTE = ['#3e63dd', '#8e4ec6', '#d6409f', '#e5484d', '#ef5f00', '#30a46c', '#12a594', '#0090ff', '#6e56cf', '#ad7f58'];

function colorFor(user: AvatarUser): string {
  const seed = fullName(user);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ user, size = 'sm', className }: { user: AvatarUser; size?: keyof typeof sizes; className?: string }) {
  const label = fullName(user);
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt={label} title={label} className={cn('shrink-0 rounded-full object-cover ring-2 ring-surface', sizes[size], className)} />;
  }
  const color = colorFor(user);
  return (
    <span
      title={label}
      aria-label={label}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-surface', sizes[size], className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, var(--surface))`, color: `color-mix(in srgb, ${color} 85%, var(--foreground))` }}
    >
      {initials(user)}
    </span>
  );
}

export function AvatarGroup({ users, max = 3, size = 'xs' }: { users: AvatarUser[]; max?: number; size?: keyof typeof sizes }) {
  if (!users.length) return <span className="text-xs text-muted">Unassigned</span>;
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((user, index) => (
        <Avatar key={`${fullName(user)}-${index}`} user={user} size={size} />
      ))}
      {rest > 0 && (
        <span className={cn('inline-flex items-center justify-center rounded-full bg-surface-muted font-bold text-muted ring-2 ring-surface shadow-clay-sm', sizes[size])}>
          +{rest}
        </span>
      )}
    </div>
  );
}
