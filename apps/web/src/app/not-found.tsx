import Link from 'next/link';
import { routes } from '@/shared/config/routes';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted">The page you are looking for does not exist or was moved.</p>
      <Link href={routes.dashboard} className="mt-2 text-sm font-medium text-brand hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
