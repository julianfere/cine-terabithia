import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screeningVotes, recommendations, screenings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const db = getDb();
  const screeningIdParam = req.nextUrl.searchParams.get('screeningId');

  const screeningRows = screeningIdParam
    ? await db.select().from(screenings).where(eq(screenings.id, Number(screeningIdParam))).limit(1)
    : await db.select().from(screenings).where(eq(screenings.status, 'upcoming')).limit(1);

  const upcoming = screeningRows[0];
  if (!upcoming) return NextResponse.json([]);

  const votes = await db.select().from(screeningVotes).where(eq(screeningVotes.screeningId, upcoming.id));

  if (screeningIdParam) return NextResponse.json(votes);

  const recIds = [...new Set(votes.map((v) => v.recommendationId))];
  const allRecs = recIds.length ? await db.select().from(recommendations) : [];
  const recs = allRecs.filter((r) => recIds.includes(r.id));

  const result = recs.map((r) => ({
    ...r,
    voters: votes.filter((v) => v.recommendationId === r.id).map((v) => v.username),
    totalVotos: votes.filter((v) => v.recommendationId === r.id).length,
  })).sort((a, b) => b.totalVotos - a.totalVotos);

  return NextResponse.json({ screening: upcoming, candidates: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { screeningId, recommendationId } = body;

  const db = getDb();
  const existing = await db.select().from(screeningVotes)
    .where(and(eq(screeningVotes.screeningId, Number(screeningId)), eq(screeningVotes.username, username)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].recommendationId === Number(recommendationId)) {
      await db.delete(screeningVotes).where(eq(screeningVotes.id, existing[0].id));
      return NextResponse.json({ voted: false });
    }
    await db.update(screeningVotes).set({ recommendationId: Number(recommendationId) }).where(eq(screeningVotes.id, existing[0].id));
    return NextResponse.json({ voted: true, changed: true });
  }

  await db.insert(screeningVotes).values({
    screeningId: Number(screeningId),
    recommendationId: Number(recommendationId),
    username,
    createdAt: Date.now(),
  });

  return NextResponse.json({ voted: true }, { status: 201 });
}
