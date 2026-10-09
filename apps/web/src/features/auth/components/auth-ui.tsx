import { AlertCircle } from 'lucide-react';

/** Shared sizing for the sign-in and sign-up forms. */
export const AUTH_INPUT = 'h-11 shadow-none';
export const AUTH_BUTTON = 'h-11 w-full justify-center bg-foreground text-surface shadow-none hover:bg-foreground/85 hover:brightness-100';

export function AuthError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}
