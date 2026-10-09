'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/shared/lib/utils';

/** Id of the control inside the nearest Field, so its label is linked without manual ids. */
const FieldIdContext = createContext<string | undefined>(undefined);
export const useFieldId = (id?: string) => {
  const fieldId = useContext(FieldIdContext);
  return id ?? fieldId;
};

const control =
  'w-full rounded-ui border border-border bg-surface px-3 text-sm text-foreground shadow-ui-sm transition-[border-color,box-shadow] duration-150 placeholder:text-muted/80 hover:border-border-strong focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted aria-invalid:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, 'h-[var(--control-h)]', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, id, ...props }, ref) => (
    <textarea ref={ref} id={useFieldId(id)} rows={rows} className={cn(control, 'py-2 leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

/** Native select styled to match inputs (native for accessibility and mobile pickers). */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        control,
        'h-[var(--control-h)] cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-[13px] font-medium text-foreground-soft', className)} {...props} />;
}

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <Label htmlFor={controlId}>
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </Label>
      )}
      <FieldIdContext.Provider value={controlId}>{children}</FieldIdContext.Provider>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }>(
  ({ label, className, id, ...props }, ref) => (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-sm text-foreground-soft', className)}>
      <input ref={ref} id={id} type="checkbox" className="size-4 cursor-pointer rounded border-border-strong accent-[var(--brand)]" {...props} />
      {label}
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';

/** Inline alert for form-level messages. */
export function FormAlert({ children, tone = 'danger' }: { children: ReactNode; tone?: 'danger' | 'success' }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-ui border px-3 py-2.5 text-sm',
        tone === 'danger' ? 'border-danger/25 bg-danger-soft text-danger' : 'border-success/25 bg-success-soft text-success',
      )}
    >
      {children}
    </div>
  );
}
