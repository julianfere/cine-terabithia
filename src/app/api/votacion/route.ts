import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screeningVotes, recommendations, screenings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const db = getDb();
  const screeningIdParam = req.nextUrl.searchParams.get('screeningId');

  const upcoming = screeningIdParam
    ? db.select().from(screenings).where(eq(screenings.id, Number(screeningIdParam))).get()
    : db.select().from(screenings).where(eq(screenings.status, 'upcoming')).get();

  if (!upcoming) return NextResponse.json([]);

  const votes = db.select().from(screeningVotes).where(eq(screeningVotes.screeningId, upcoming.id)).all();

  // When called with screeningId (admin assign panel), return raw votes
  if (screeningIdParam) return NextResponse.json(votes);

  const recIds = [...new Set(votes.map((v) => v.recommendationId))];
  const recs = recIds.length
    ? db.select().from(recommendations).all().filter((r) => recIds.includes(r.id))
    : [];

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
  const existing = db.select().from(screeningVotes)
    .where(and(eq(screeningVotes.screeningId, Number(screeningId)), eq(screeningVotes.username, username)))
    .get();

  if (existing) {
    if (existing.recommendationId === Number(recommendationId)) {
      db.delete(screeningVotes).where(eq(screeningVotes.id, existing.id)).run();
      return NextResponse.json({ voted: false });
    }
    db.update(screeningVotes).set({ recommendationId: Number(recommendationId) }).where(eq(screeningVotes.id, existing.id)).run();
    return NextResponse.json({ voted: true, changed: true });
  }

  db.insert(screeningVotes).values({
    screeningId: Number(screeningId),
    recommendationId: Number(recommendationId),
    username,
    createdAt: Date.now(),
  }).run();

  return NextResponse.json({ voted: true }, { status: 201 });
}
