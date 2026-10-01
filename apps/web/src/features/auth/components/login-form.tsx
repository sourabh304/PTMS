'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Field, FormAlert, Input } from '@/shared/ui/form';
import { useAuthConfig, useLogin } from '../api';
import { loginSchema, type LoginValues } from '../schemas';

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
      {login.isError && <FormAlert>{errorMessage(login.error)}</FormAlert>}
      <Field label="Work email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...form.register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
      </Field>
      <Button type="submit" size="lg" className="w-full justify-center" loading={form.formState.isSubmitting}>
        Sign in
      </Button>
      {config?.allowPublicRegistration && (
        <p className="text-center text-sm text-muted">
          New to {config.appName}?{' '}
          <Link href={routes.register} className="font-medium text-brand hover:underline">
            Create a workspace
          </Link>
        </p>
      )}
    </form>
  );
}
