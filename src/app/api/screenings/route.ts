import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { movies, screenings, scores } from '@/db/schema';
import { eq, desc, avg, count } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  const db = getDb();
  const rows = db
    .select({
      id: screenings.id,
      movieId: screenings.movieId,
      scheduledDate: screenings.scheduledDate,
      hour: screenings.hour,
      status: screenings.status,
      snack: screenings.snack,
      location: screenings.location,
      curatedBy: screenings.curatedBy,
      title: movies.title,
      year: movies.year,
      director: movies.director,
      genre: movies.genre,
      posterHue: movies.posterHue,
      posterPath: movies.posterPath,
      duration: movies.duration,
      synopsis: movies.synopsis,
    })
    .from(screenings)
    .leftJoin(movies, eq(screenings.movieId, movies.id))
    .orderBy(desc(screenings.scheduledDate))
    .all();

  const avgScores = db
    .select({ screeningId: scores.screeningId, avg: avg(scores.score), cnt: count(scores.id) })
    .from(scores)
    .groupBy(scores.screeningId)
    .all();

  const avgMap = new Map(avgScores.map((s) => [s.screeningId, { avg: Number(s.avg || 0), cnt: s.cnt }]));

  return NextResponse.json(rows.map((r) => ({ ...r, avgScore: avgMap.get(r.id)?.avg ?? null, scoreCount: avgMap.get(r.id)?.cnt ?? 0 })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  let movieId = body.movieId ?? null;
  if (!movieId && body.title?.trim()) {
    const result = db.insert(movies).values({
      title: body.title,
      year: body.year,
      director: body.director,
      genre: body.genre,
      duration: body.duration,
      synopsis: body.synopsis,
      posterHue: body.posterHue ?? 200,
      tmdbId: body.tmdbId,
      posterPath: body.posterPath,
      createdAt: Date.now(),
    }).returning({ id: movies.id }).get();
    movieId = result.id;
  }

  const result = db.insert(screenings).values({
    movieId,
    scheduledDate: body.scheduledDate,
    hour: body.hour,
    status: body.status ?? 'upcoming',
    snack: body.snack,
    location: body.location,
    curatedBy: body.curatedBy,
    notes: body.notes,
    createdAt: Date.now(),
  }).returning().get();

  return NextResponse.json(result, { status: 201 });
}
