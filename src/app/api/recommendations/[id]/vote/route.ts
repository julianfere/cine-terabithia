import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendationVotes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const existing = db.select().from(recommendationVotes)
    .where(and(eq(recommendationVotes.recommendationId, Number(id)), eq(recommendationVotes.username, username)))
    .get();

  if (existing) {
    db.delete(recommendationVotes).where(eq(recommendationVotes.id, existing.id)).run();
    return NextResponse.json({ voted: false });
  }

  db.insert(recommendationVotes).values({
    recommendationId: Number(id),
    username,
    createdAt: Date.now(),
  }).run();

  return NextResponse.json({ voted: true }, { status: 201 });
}
