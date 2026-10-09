'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Checkbox, Field, FormAlert, Input } from '@/shared/ui/form';
import { authApi, useAuthConfig, useLogin } from '../api';
import { loginSchema, type LoginValues } from '../schemas';

/** Only allow same-app relative redirects after login. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : routes.home;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const { data: config } = useAuthConfig();
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    let destination: string;
    try {
      await login.mutateAsync(values);
      destination = safeNext(searchParams.get('next'));
    } catch {
      return; // surfaced through login.error
    }
    router.replace(destination);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {login.isError && <FormAlert>{errorMessage(login.error)}</FormAlert>}

      <Field label="Work email" htmlFor="email" error={errors.email?.message}>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input id="email" type="email" autoComplete="email" autoFocus placeholder="name@company.com" className="h-11 pl-9" {...form.register('email')} />
        </div>
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-[13px] font-medium text-foreground-soft">
            Password
          </label>
          <button type="button" onClick={() => setShowResetHelp((v) => !v)} className="text-xs font-medium text-brand hover:underline" aria-expanded={showResetHelp}>
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••••"
            aria-invalid={!!errors.password}
            className="h-11 px-9"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-ui text-muted transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>}
        {showResetHelp && (
          <p className="mt-2 flex gap-2 rounded-ui bg-surface-muted px-3 py-2 text-xs text-foreground-soft animate-fade-in">
            <Info className="mt-0.5 size-3.5 shrink-0 text-brand" />
            Passwords are reset by your workspace administrator under Settings → Users. Ask them for a new temporary password.
          </p>
        )}
      </div>

      <Checkbox
        id="remember"
        label={config ? `Keep me signed in for ${config.rememberMeDays} days` : 'Keep me signed in'}
        {...form.register('remember')}
      />

      <Button type="submit" size="lg" className="w-full justify-center" loading={isSubmitting}>
        Sign in {!isSubmitting && <ArrowRight />}
      </Button>

      {appConfig.supportEmail && (
        <p className="text-center text-sm text-muted">
          Need an account?{' '}
          <a href={`mailto:${appConfig.supportEmail}`} className="font-medium text-brand hover:underline">
            Contact your administrator
          </a>
        </p>
      )}
    </form>
  );
}
