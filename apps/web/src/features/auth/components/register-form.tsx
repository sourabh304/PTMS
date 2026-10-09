'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { EmptyState, Spinner } from '@/shared/ui/feedback';
import { Field, Input } from '@/shared/ui/form';
import { useAuthConfig, useRegister } from '../api';
import { registerSchema, type RegisterValues } from '../schemas';
import { AUTH_BUTTON, AUTH_INPUT, AuthError } from './auth-ui';
import { PasswordInput } from './password-input';

export function RegisterForm() {
  const { data: config, isLoading } = useAuthConfig();
  if (isLoading) return <Spinner />;
  if (!config?.allowPublicRegistration) {
    return (
      <EmptyState
        title="Sign-up is disabled"
        description="Ask your administrator to create an account for you."
        action={
          <Link href={routes.login} className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            Back to sign in
          </Link>
        }
      />
    );
  }
  return <RegisterFormFields minLength={config.passwordPolicy.minLength} />;
}

function RegisterFormFields({ minLength }: { minLength: number }) {
  const router = useRouter();
  const register = useRegister();
  const schema = useMemo(() => registerSchema(minLength), [minLength]);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { organizationName: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _confirm, ...values }) => {
    try {
      await register.mutateAsync(values);
    } catch {
      return; // surfaced through register.error
    }
    router.replace(routes.dashboard);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {register.isError && <AuthError message={errorMessage(register.error)} />}
      <Field label="Company or team name" htmlFor="organizationName" error={errors.organizationName?.message}>
        <Input id="organizationName" autoFocus placeholder="Acme Inc." className={AUTH_INPUT} {...form.register('organizationName')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
          <Input id="firstName" autoComplete="given-name" className={AUTH_INPUT} {...form.register('firstName')} />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
          <Input id="lastName" autoComplete="family-name" className={AUTH_INPUT} {...form.register('lastName')} />
        </Field>
      </div>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" className={AUTH_INPUT} {...form.register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint={`At least ${minLength} characters, with an upper-case letter, a lower-case letter and a number`}>
        <PasswordInput id="password" autoComplete="new-password" className={AUTH_INPUT} {...form.register('password')} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" className={AUTH_INPUT} {...form.register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className={AUTH_BUTTON} loading={form.formState.isSubmitting}>
        Create workspace
      </Button>
      <p className="border-t border-border pt-5 text-sm text-muted">
        Already have an account?{' '}
        <Link href={routes.login} className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
          Sign in
        </Link>
      </p>
    </form>
  );
}
