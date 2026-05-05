import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screenings, scores, screeningVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const result = await db.update(screenings).set(body).where(eq(screenings.id, Number(id))).returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  await db.delete(screeningVotes).where(eq(screeningVotes.screeningId, numId));
  await db.delete(scores).where(eq(scores.screeningId, numId));
  await db.delete(screenings).where(eq(screenings.id, numId));
  return NextResponse.json({ ok: true });
}
