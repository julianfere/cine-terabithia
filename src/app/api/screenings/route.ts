import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { movies, screenings, scores } from '@/db/schema';
import { eq, desc, avg, count } from 'drizzle-orm';
import { auth } from '@/auth';
import { sendPushToAll } from '@/lib/push';

export async function GET() {
  const db = getDb();
  const rows = await db
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
    .orderBy(desc(screenings.scheduledDate));

  const avgScores = await db
    .select({ screeningId: scores.screeningId, avg: avg(scores.score), cnt: count(scores.id) })
    .from(scores)
    .groupBy(scores.screeningId);

  const avgMap = new Map(avgScores.map((s) => [s.screeningId, { avg: Number(s.avg || 0), cnt: Number(s.cnt) }]));

  return NextResponse.json(rows.map((r) => ({ ...r, avgScore: avgMap.get(r.id)?.avg ?? null, scoreCount: avgMap.get(r.id)?.cnt ?? 0 })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  let movieId = body.movieId ?? null;
  if (!movieId && body.title?.trim()) {
    if (body.tmdbId) {
      const existing = await db.select({ id: movies.id }).from(movies).where(eq(movies.tmdbId, body.tmdbId)).limit(1);
      if (existing[0]) movieId = existing[0].id;
    }
    if (!movieId) {
      const result = await db.insert(movies).values({
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
      }).returning({ id: movies.id });
      movieId = result[0].id;
    }
  }

  const result = await db.insert(screenings).values({
    movieId,
    scheduledDate: body.scheduledDate,
    hour: body.hour,
    status: body.status ?? 'upcoming',
    snack: body.snack,
    location: body.location,
    curatedBy: body.curatedBy || session.user?.name || null,
    notes: body.notes,
    createdAt: Date.now(),
  }).returning();

  const date = body.scheduledDate ?? '';
  const hour = body.hour ? ` a las ${body.hour}` : '';

  if (movieId && body.title) {
    sendPushToAll({
      title: 'Nueva función en Cine Terabithia',
      body: `${body.title}${body.year ? ` (${body.year})` : ''} — ${date}${hour}`,
      url: '/',
    }).catch(() => {});
  } else {
    sendPushToAll({
      title: '¡Nueva función para votar!',
      body: `Se programó una función para el ${date} — elegí la película`,
      url: '/votacion',
    }).catch(() => {});
  }

  return NextResponse.json(result[0], { status: 201 });
}
