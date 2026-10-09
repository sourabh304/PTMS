'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/form';
import { useAuthConfig, useLogin } from '../api';
import { loginSchema, type LoginValues } from '../schemas';
import { AUTH_BUTTON, AUTH_INPUT, AuthError } from './auth-ui';
import { PasswordInput } from './password-input';

/** Only allow same-app relative redirects after login. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : routes.dashboard;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const { data: config } = useAuthConfig();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch {
      return; // surfaced through login.error
    }
    router.replace(safeNext(searchParams.get('next')));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {login.isError && <AuthError message={errorMessage(login.error)} />}
      <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" autoFocus className={AUTH_INPUT} {...form.register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" className={AUTH_INPUT} {...form.register('password')} />
      </Field>
      <Button type="submit" size="lg" className={AUTH_BUTTON} loading={form.formState.isSubmitting}>
        Sign in
      </Button>
      <p className="text-xs text-muted">Forgot your password? Ask your admin to reset it.</p>
      {config?.allowPublicRegistration && (
        <p className="border-t border-border pt-5 text-sm text-muted">
          New to {config.appName}?{' '}
          <Link href={routes.register} className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            Create a workspace
          </Link>
        </p>
      )}
    </form>
  );
}
