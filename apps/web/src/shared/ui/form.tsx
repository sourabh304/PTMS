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
  'w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-xs placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-surface-muted disabled:opacity-70 aria-invalid:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, id, ...props }, ref) => <input ref={ref} id={useFieldId(id)} className={cn(control, 'h-9', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, id, ...props }, ref) => (
    <textarea ref={ref} id={useFieldId(id)} rows={rows} className={cn(control, 'py-2 leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, id, ...props }, ref) => (
    <select ref={ref} id={useFieldId(id)} className={cn(control, 'h-9 pr-8', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-xs font-semibold text-foreground/80', className)} {...props} />;
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
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }>(
  ({ label, className, id, ...props }, ref) => (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-2 text-sm', className)}>
      <input ref={ref} id={id} type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--brand)]" {...props} />
      {label}
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';

/** Color swatch plus hex text box sharing one value; the label targets the text box. */
export function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-2">
      <input type="color" aria-label="Pick a color" className={cn(control, 'h-9 w-14 shrink-0 p-1')} value={value} onChange={(e) => onChange(e.target.value)} />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
