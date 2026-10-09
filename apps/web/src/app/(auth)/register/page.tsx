import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create workspace' };

export default function RegisterPage() {
  return (
    <AuthShell title="Create a workspace" subtitle="A shared home for your team’s projects.">
      <RegisterForm />
    </AuthShell>
  );
}
