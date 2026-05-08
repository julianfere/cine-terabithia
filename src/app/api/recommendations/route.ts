import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { movies, recommendations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getRecommendations } from '@/lib/data';

export async function GET() {
  const recs = await getRecommendations();
  return NextResponse.json(recs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const username = session?.user?.name;
  if (!userId || !username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { title, year, director, genre, duration, posterHue, tmdbId, posterPath, reason } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const db = getDb();

  // Encontrar o crear la película
  let movieId: number;
  if (tmdbId) {
    const existing = await db.select({ id: movies.id }).from(movies).where(eq(movies.tmdbId, tmdbId)).limit(1);
    if (existing[0]) {
      movieId = existing[0].id;
    } else {
      const [movie] = await db.insert(movies).values({
        tmdbId, title, year, director, genre, duration,
        posterHue: posterHue ?? 200, posterPath,
      }).returning({ id: movies.id });
      movieId = movie.id;
    }
  } else {
    const [movie] = await db.insert(movies).values({
      title, year, director, genre, duration,
      posterHue: posterHue ?? 200, posterPath,
    }).returning({ id: movies.id });
    movieId = movie.id;
  }

  const [rec] = await db.insert(recommendations).values({
    movieId,
    suggestedById: userId,
    reason: reason ?? null,
  }).returning();

  return NextResponse.json({
    id: rec.id,
    movieId,
    title: title ?? '',
    year: year ?? null,
    director: director ?? null,
    genre: genre ?? null,
    duration: duration ?? null,
    posterHue: posterHue ?? 200,
    posterPath: posterPath ?? null,
    tmdbId: tmdbId ?? null,
    suggestedById: userId,
    suggestedBy: username,
    reason: reason ?? null,
    featured: false,
    votes: 0,
    voters: [],
    createdAt: rec.createdAt,
  }, { status: 201 });
}
