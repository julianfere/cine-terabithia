import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const SKIP_TRACK = ['/api/', '/_next/', '/favicon', '/sw.js', '/manifest', '/icons/', '/offline'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/login';

  if (!req.auth && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (!SKIP_TRACK.some(p => pathname.startsWith(p))) {
    const userId = req.auth?.user?.id ?? null;
    const sessionId =
      req.cookies.get('authjs.session-token')?.value ??
      req.cookies.get('__Secure-authjs.session-token')?.value ??
      null;

    fetch(`${req.nextUrl.origin}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        userId,
        sessionId: sessionId ? sessionId.slice(0, 36) : null,
        userAgent: req.headers.get('user-agent'),
      }),
    }).catch(() => {});
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|funciones/|icon.svg|icons/|sw.js|manifest.webmanifest|offline).*)'],
};
