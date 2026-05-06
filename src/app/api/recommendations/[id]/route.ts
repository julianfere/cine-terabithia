import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendations, recommendationVotes, screeningVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, numId));
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const username = session.user?.name;
  if (session.user?.role !== 'admin' && rec.suggestedBy !== username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await db.delete(screeningVotes).where(eq(screeningVotes.recommendationId, numId));
  await db.delete(recommendationVotes).where(eq(recommendationVotes.recommendationId, numId));
  await db.delete(recommendations).where(eq(recommendations.id, numId));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, numId));
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const username = session.user?.name;
  if (session.user?.role !== 'admin' && rec.suggestedBy !== username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const result = await db.update(recommendations).set(body).where(eq(recommendations.id, numId)).returning();
  return NextResponse.json(result[0]);
}
