'use client';

import { Check, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import type { Lookup } from '@/features/lookups/types';
import { routes } from '@/shared/config/routes';
import { Permission } from '@/shared/constants/domain';
import { cn, contrastText } from '@/shared/lib/utils';
import type { LookupRef } from '@/shared/types/api';
import { Popover } from '@/shared/ui/popover';

interface LookupCellProps {
  value: LookupRef;
  options: Lookup[];
  onChange: (option: Lookup) => void;
  disabled?: boolean;
  /** Accessible name of the column, e.g. "Status". */
  label: string;
}

/** Full-color label cell (status, priority…) with a palette of the configured values. */
export function LookupCell({ value, options, onChange, disabled, label }: LookupCellProps) {
  const { can } = usePermissions();
  return (
    <Popover
      align="center"
      disabled={disabled}
      className="w-52"
      trigger={({ ref, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={`${label}: ${value.name}`}
          className="flex h-full w-full items-center justify-center truncate px-2 text-[13px] font-medium transition-[filter] hover:brightness-95 disabled:cursor-default disabled:hover:brightness-100"
          style={{ backgroundColor: value.color, color: contrastText(value.color) }}
        >
          <span className="truncate">{value.name}</span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <ul className="space-y-1">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    if (option.id !== value.id) onChange(option);
                  }}
                  className="relative flex h-8 w-full items-center justify-center rounded-ui px-6 text-[13px] font-medium transition-[filter] hover:brightness-95"
                  style={{ backgroundColor: option.color, color: contrastText(option.color) }}
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === value.id && <Check className="absolute right-2 size-3.5" />}
                </button>
              </li>
            ))}
          </ul>
          {can(Permission.USERS_VIEW) && (
            <Link
              href={routes.settingsWorkflow}
              onClick={close}
              className={cn('mt-2 flex items-center justify-center gap-1.5 border-t border-border pt-2 text-xs font-medium text-muted hover:text-foreground')}
            >
              <Settings2 className="size-3.5" /> Edit labels
            </Link>
          )}
        </div>
      )}
    </Popover>
  );
}
