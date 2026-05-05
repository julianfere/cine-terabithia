import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { movies, screenings, recommendations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { recommendationId } = await req.json();
  const db = getDb();

  const recRows = await db.select().from(recommendations).where(eq(recommendations.id, Number(recommendationId))).limit(1);
  const rec = recRows[0];
  if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });

  let movieId: number;
  if (rec.tmdbId) {
    const existing = await db.select({ id: movies.id }).from(movies).where(eq(movies.tmdbId, rec.tmdbId)).limit(1);
    if (existing[0]) {
      movieId = existing[0].id;
    } else {
      const m = await db.insert(movies).values({
        tmdbId: rec.tmdbId, title: rec.title, year: rec.year, director: rec.director,
        genre: rec.genre, duration: rec.duration, posterPath: rec.posterPath,
        posterHue: rec.posterHue ?? 200, createdAt: Date.now(),
      }).returning({ id: movies.id });
      movieId = m[0].id;
    }
  } else {
    const m = await db.insert(movies).values({
      title: rec.title, year: rec.year, director: rec.director,
      genre: rec.genre, duration: rec.duration, posterPath: rec.posterPath,
      posterHue: rec.posterHue ?? 200, createdAt: Date.now(),
    }).returning({ id: movies.id });
    movieId = m[0].id;
  }

  await db.update(screenings).set({ movieId }).where(eq(screenings.id, Number(id)));

  const updated = await db.select({
    id: screenings.id, scheduledDate: screenings.scheduledDate, hour: screenings.hour,
    status: screenings.status, movieId: screenings.movieId,
    title: movies.title, year: movies.year, director: movies.director,
    genre: movies.genre, posterPath: movies.posterPath, posterHue: movies.posterHue,
  }).from(screenings).leftJoin(movies, eq(screenings.movieId, movies.id))
    .where(eq(screenings.id, Number(id))).limit(1);

  return NextResponse.json(updated[0]);
}
