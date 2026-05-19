import webpush from 'web-push';
import { getDb } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'noreply@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type SendResult = { sent: number; failed: number };

async function sendToSubs(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
): Promise<SendResult> {
  const db = getDb();
  const notification = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' });
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }),
  );

  return { sent, failed };
}

export async function sendPushToAll(payload: PushPayload): Promise<SendResult> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { sent: 0, failed: 0 };
  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);
  if (!subs.length) return { sent: 0, failed: 0 };
  return sendToSubs(subs, payload);
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<SendResult> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { sent: 0, failed: 0 };
  if (!userIds.length) return { sent: 0, failed: 0 };
  const db = getDb();
  const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
  if (!subs.length) return { sent: 0, failed: 0 };
  return sendToSubs(subs, payload);
}
