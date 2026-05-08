import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendationVotes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const existing = await db.select().from(recommendationVotes)
    .where(and(eq(recommendationVotes.recommendationId, Number(id)), eq(recommendationVotes.userId, userId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(recommendationVotes).where(eq(recommendationVotes.id, existing[0].id));
    return NextResponse.json({ voted: false });
  }

  await db.insert(recommendationVotes).values({ recommendationId: Number(id), userId });
  return NextResponse.json({ voted: true }, { status: 201 });
}
