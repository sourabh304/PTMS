import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create workspace' };

export default function RegisterPage() {
  return (
    <AuthShell title="Create your workspace" subtitle="Set up your organization in less than a minute.">
      <RegisterForm />
    </AuthShell>
  );
}
