import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import webpush from 'web-push';

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'test@test.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'Prueba', body: 'Funciona!', url: '/' }),
      )
    )
  );

  return NextResponse.json({
    subscriptions: subs.length,
    results: results.map((r) =>
      r.status === 'fulfilled'
        ? { ok: true, statusCode: r.value.statusCode }
        : { ok: false, error: String((r.reason as { message?: string })?.message ?? r.reason), statusCode: (r.reason as { statusCode?: number })?.statusCode, body: (r.reason as { body?: string })?.body }
    ),
  });
}
