import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

/** Horizontally scrollable on small screens so wide tables never break the layout. */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-border bg-surface-muted/50 px-4 py-2.5 text-left text-xs font-medium text-muted first:pl-[var(--card-p)] last:pr-[var(--card-p)]',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('border-b border-border px-4 py-[var(--row-py)] align-middle text-foreground-soft first:pl-[var(--card-p)] last:pr-[var(--card-p)]', className)}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-surface-hover [&:last-child>td]:border-b-0', className)} {...props} />;
}
