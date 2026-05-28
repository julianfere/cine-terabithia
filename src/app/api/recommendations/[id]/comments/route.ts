import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendationComments, recommendationCommentVotes, users } from '@/db/schema';
import { eq, asc, sum, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recId = Number(id);
  if (isNaN(recId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const db = getDb();

  const rows = await db
    .select({
      id: recommendationComments.id,
      recommendationId: recommendationComments.recommendationId,
      userId: recommendationComments.userId,
      username: users.username,
      content: recommendationComments.content,
      createdAt: recommendationComments.createdAt,
      score: sum(recommendationCommentVotes.value),
    })
    .from(recommendationComments)
    .innerJoin(users, eq(recommendationComments.userId, users.id))
    .leftJoin(recommendationCommentVotes, eq(recommendationCommentVotes.commentId, recommendationComments.id))
    .where(eq(recommendationComments.recommendationId, recId))
    .groupBy(recommendationComments.id, users.username)
    .orderBy(asc(recommendationComments.createdAt));

  const myVotesMap = new Map<number, number>();
  if (userId) {
    const myVotes = await db
      .select({ commentId: recommendationCommentVotes.commentId, value: recommendationCommentVotes.value })
      .from(recommendationCommentVotes)
      .innerJoin(recommendationComments, eq(recommendationCommentVotes.commentId, recommendationComments.id))
      .where(and(
        eq(recommendationCommentVotes.userId, userId),
        eq(recommendationComments.recommendationId, recId),
      ));
    myVotes.forEach((v) => myVotesMap.set(v.commentId!, Number(v.value)));
  }

  return NextResponse.json(rows.map((r) => ({
    ...r,
    score: Number(r.score ?? 0),
    myVote: (myVotesMap.get(r.id) ?? 0) as 1 | -1 | 0,
  })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const recId = Number(id);
  if (isNaN(recId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

  const db = getDb();
  const [comment] = await db
    .insert(recommendationComments)
    .values({ recommendationId: recId, userId, content: content.trim() })
    .returning();

  return NextResponse.json({ ...comment, username: session?.user?.name, score: 0, myVote: 0 }, { status: 201 });
}
