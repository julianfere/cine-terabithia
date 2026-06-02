'use client';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Evita trackear la misma ruta dos veces seguidas (StrictMode doble-mount, etc.)
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        userId: session?.user?.id ?? null,
      }),
    }).catch(() => {});
  }, [pathname, session?.user?.id]);

  return null;
}
