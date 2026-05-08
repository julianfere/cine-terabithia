import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screenings } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();

  const result = await db
    .update(screenings)
    .set({ status: 'past' })
    .where(and(eq(screenings.status, 'upcoming'), lt(screenings.scheduledDate, today)))
    .returning({ id: screenings.id });

  return NextResponse.json({ updated: result.length, ids: result.map((r) => r.id) });
}
