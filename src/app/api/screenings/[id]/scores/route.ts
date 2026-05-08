import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { scores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { getScoresForScreening } from '@/lib/data';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await getScoresForScreening(Number(id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { score, comment } = body;

  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.select().from(scores)
    .where(and(eq(scores.screeningId, Number(id)), eq(scores.userId, userId)))
    .limit(1);

  if (existing[0]) {
    const updated = await db.update(scores)
      .set({ score, comment: comment || null })
      .where(eq(scores.id, existing[0].id))
      .returning();
    const rows = await getScoresForScreening(Number(id));
    const full = rows.find((r) => r.id === updated[0].id);
    return NextResponse.json(full ?? updated[0]);
  }

  const result = await db.insert(scores).values({
    screeningId: Number(id),
    userId,
    score,
    comment: comment || null,
  }).returning();

  const rows = await getScoresForScreening(Number(id));
  const full = rows.find((r) => r.id === result[0].id);
  return NextResponse.json(full ?? result[0], { status: 201 });
}
