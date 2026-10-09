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

export function RegisterForm() {
  const { data: config, isLoading } = useAuthConfig();
  if (isLoading) return <Spinner />;
  if (!config?.allowPublicRegistration) {
    return (
      <EmptyState
        title="Sign-up is disabled"
        description="Ask your administrator to create an account for you."
        action={
          <Link href={routes.login} className="text-sm font-medium text-brand hover:underline">
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {register.isError && (
        <div role="alert" className="clay-inset rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-700">
          {errorMessage(register.error)}
        </div>
      )}
      <Field label="Organization name" htmlFor="organizationName" error={errors.organizationName?.message}>
        <Input id="organizationName" autoFocus {...form.register('organizationName')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
          <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
          <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
        </Field>
      </div>
      <Field label="Work email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint={`At least ${minLength} characters with upper, lower case and a number`}>
        <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full justify-center" loading={form.formState.isSubmitting}>
        Create workspace
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href={routes.login} className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
