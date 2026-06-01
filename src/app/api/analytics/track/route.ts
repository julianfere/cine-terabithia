import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { pageViews } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { path, userId, sessionId, userAgent } = await req.json();

    const db = getDb();
    await db.insert(pageViews).values({
      path: String(path ?? '').slice(0, 255),
      userId: userId ? Number(userId) : null,
      sessionId: sessionId ? String(sessionId).slice(0, 36) : null,
      userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
