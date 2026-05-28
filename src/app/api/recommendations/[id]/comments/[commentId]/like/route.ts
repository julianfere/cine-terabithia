import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendationCommentVotes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

// POST body: { value: 1 | -1 }
// Si el usuario ya votó con el mismo valor, retira el voto.
// Si votó con valor distinto, cambia el voto.
export async function POST(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { commentId } = await params;
  const cId = Number(commentId);
  if (isNaN(cId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { value } = await req.json();
  if (value !== 1 && value !== -1) return NextResponse.json({ error: 'value must be 1 or -1' }, { status: 400 });

  const db = getDb();
  const existing = await db
    .select({ id: recommendationCommentVotes.id, value: recommendationCommentVotes.value })
    .from(recommendationCommentVotes)
    .where(and(eq(recommendationCommentVotes.commentId, cId), eq(recommendationCommentVotes.userId, userId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].value === value) {
      // mismo voto → retirar
      await db.delete(recommendationCommentVotes).where(eq(recommendationCommentVotes.id, existing[0].id));
      return NextResponse.json({ myVote: 0 });
    }
    // voto distinto → cambiar
    await db.update(recommendationCommentVotes).set({ value }).where(eq(recommendationCommentVotes.id, existing[0].id));
    return NextResponse.json({ myVote: value });
  }

  await db.insert(recommendationCommentVotes).values({ commentId: cId, userId, value });
  return NextResponse.json({ myVote: value });
}
