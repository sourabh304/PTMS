import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_ROUTES, routes } from '@/shared/config/routes';

// Must match the API's REFRESH_COOKIE_NAME (its default is sptms_rt).
const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE_NAME || 'sptms_rt';

/**
 * Optimistic route protection: users without a session cookie are sent to the login page.
 * Real authorization is always enforced by the API.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hasSession = REFRESH_COOKIE ? request.cookies.has(REFRESH_COOKIE) : true;

  if (!isPublic && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = routes.login;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip API proxy, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
