import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendances, recommendations, scores } from '@/db/schema';
import { eq, avg, count } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = getDb();
  const [ticketRows, suggestionRows, scoreRows] = await Promise.all([
    db.select({ cnt: count(attendances.id) }).from(attendances).where(eq(attendances.username, username)),
    db.select({ cnt: count(recommendations.id) }).from(recommendations).where(eq(recommendations.suggestedBy, username)),
    db.select({ avg: avg(scores.score) }).from(scores).where(eq(scores.username, username)),
  ]);

  const ticketCount = Number(ticketRows[0]?.cnt ?? 0);
  const avgRaw = Number(scoreRows[0]?.avg ?? 0);

  return NextResponse.json({
    ticketCount,
    suggestionsCount: Number(suggestionRows[0]?.cnt ?? 0),
    avgScore: ticketCount > 0 && avgRaw > 0 ? Math.round(avgRaw * 10) / 10 : 0,
  });
}
