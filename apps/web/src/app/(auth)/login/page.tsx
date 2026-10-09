import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your projects and tasks.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
