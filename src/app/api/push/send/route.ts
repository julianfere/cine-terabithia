import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { notificationLogs } from '@/db/schema';
import { sendPushToAll, sendPushToUsers } from '@/lib/push';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, body, url = '/', recipients } = await req.json() as {
    title: string;
    body: string;
    url?: string;
    recipients: 'all' | number[];
  };

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 });
  }

  const isAll = recipients === 'all';
  const result = isAll
    ? await sendPushToAll({ title, body, url })
    : await sendPushToUsers(recipients, { title, body, url });

  const db = getDb();
  const [log] = await db.insert(notificationLogs).values({
    title,
    body,
    url,
    sentByUserId: Number(session.user!.id),
    recipientType: isAll ? 'all' : 'custom',
    recipientUserIds: isAll ? null : JSON.stringify(recipients),
    sent: result.sent,
    failed: result.failed,
  }).returning();

  return NextResponse.json({ ...result, id: log.id });
}
