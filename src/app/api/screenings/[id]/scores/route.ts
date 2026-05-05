import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { scores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const rows = await db.select().from(scores).where(eq(scores.screeningId, Number(id)));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { score, comment } = body;

  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.select().from(scores)
    .where(and(eq(scores.screeningId, Number(id)), eq(scores.username, username)))
    .limit(1);

  if (existing[0]) {
    const updated = await db.update(scores)
      .set({ score, comment: comment || null })
      .where(eq(scores.id, existing[0].id))
      .returning();
    return NextResponse.json(updated[0]);
  }

  const result = await db.insert(scores).values({
    screeningId: Number(id),
    username,
    score,
    comment: comment || null,
    createdAt: Date.now(),
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
