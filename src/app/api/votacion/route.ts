import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screeningVotes, recommendations, screenings, movies, users } from '@/db/schema';
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

  const votes = await db
    .select({
      id: screeningVotes.id,
      screeningId: screeningVotes.screeningId,
      recommendationId: screeningVotes.recommendationId,
      userId: screeningVotes.userId,
      username: users.username,
    })
    .from(screeningVotes)
    .innerJoin(users, eq(screeningVotes.userId, users.id))
    .where(eq(screeningVotes.screeningId, upcoming.id));

  if (screeningIdParam) return NextResponse.json(votes);

  const recIds = [...new Set(votes.map((v) => v.recommendationId).filter((id): id is number => id !== null))];
  if (!recIds.length) return NextResponse.json({ screening: upcoming, candidates: [] });

  const [allRecs, userRows] = await Promise.all([
    db
      .select({
        id: recommendations.id,
        movieId: recommendations.movieId,
        suggestedById: recommendations.suggestedById,
        reason: recommendations.reason,
        featured: recommendations.featured,
        title: movies.title,
        year: movies.year,
        director: movies.director,
        genre: movies.genre,
        duration: movies.duration,
        posterHue: movies.posterHue,
        posterPath: movies.posterPath,
        tmdbId: movies.tmdbId,
      })
      .from(recommendations)
      .leftJoin(movies, eq(recommendations.movieId, movies.id)),
    db.select({ id: users.id, username: users.username }).from(users),
  ]);

  const userMap = new Map(userRows.map((u) => [u.id, u.username]));
  const recs = allRecs.filter((r) => recIds.includes(r.id));

  const candidates = recs.map((r) => ({
    ...r,
    suggestedBy: userMap.get(r.suggestedById) ?? '',
    voters: votes.filter((v) => v.recommendationId === r.id).map((v) => v.username),
    totalVotos: votes.filter((v) => v.recommendationId === r.id).length,
  })).sort((a, b) => b.totalVotos - a.totalVotos);

  return NextResponse.json({ screening: upcoming, candidates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { screeningId, recommendationId } = body;

  const db = getDb();
  const existing = await db.select().from(screeningVotes)
    .where(and(eq(screeningVotes.screeningId, Number(screeningId)), eq(screeningVotes.userId, userId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].recommendationId === Number(recommendationId)) {
      await db.delete(screeningVotes).where(eq(screeningVotes.id, existing[0].id));
      return NextResponse.json({ voted: false });
    }
    await db.update(screeningVotes)
      .set({ recommendationId: Number(recommendationId) })
      .where(eq(screeningVotes.id, existing[0].id));
    return NextResponse.json({ voted: true, changed: true });
  }

  await db.insert(screeningVotes).values({
    screeningId: Number(screeningId),
    recommendationId: Number(recommendationId),
    userId,
  });
  return NextResponse.json({ voted: true }, { status: 201 });
}
