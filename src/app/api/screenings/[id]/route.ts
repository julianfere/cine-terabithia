import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screenings, movies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { sendPushToAll } from '@/lib/push';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const { title, year, director, genre, duration, synopsis, posterPath, tmdbId, ...screeningFields } = body;

  const [before] = await db
    .select({ scheduledDate: screenings.scheduledDate, hour: screenings.hour, movieId: screenings.movieId })
    .from(screenings).where(eq(screenings.id, Number(id))).limit(1);

  const result = await db.update(screenings).set(screeningFields).where(eq(screenings.id, Number(id))).returning();
  const screening = result[0];

  if (screening?.movieId && title !== undefined) {
    const movieUpdate: Record<string, unknown> = { title };
    if (year !== undefined) movieUpdate.year = year;
    if (director !== undefined) movieUpdate.director = director;
    if (genre !== undefined) movieUpdate.genre = genre;
    if (duration !== undefined) movieUpdate.duration = duration;
    if (synopsis !== undefined) movieUpdate.synopsis = synopsis;
    if (posterPath !== undefined) movieUpdate.posterPath = posterPath;
    if (tmdbId !== undefined) movieUpdate.tmdbId = tmdbId;
    await db.update(movies).set(movieUpdate).where(eq(movies.id, screening.movieId));
  }

  const dateChanged = screeningFields.scheduledDate && screeningFields.scheduledDate !== before?.scheduledDate;
  const hourChanged = screeningFields.hour !== undefined && screeningFields.hour !== before?.hour;

  if (before && (dateChanged || hourChanged)) {
    const newDate = screeningFields.scheduledDate ?? before.scheduledDate;
    const newHour = screeningFields.hour ?? before.hour;
    const hourStr = newHour ? ` a las ${newHour}` : '';

    let movieTitle = title as string | undefined;
    if (!movieTitle && screening?.movieId) {
      const [m] = await db.select({ title: movies.title }).from(movies).where(eq(movies.id, screening.movieId)).limit(1);
      movieTitle = m?.title;
    }

    const notifBody = movieTitle
      ? `${movieTitle} cambió al ${newDate}${hourStr}`
      : `Una función fue reprogramada al ${newDate}${hourStr}`;

    sendPushToAll({ title: 'Función reprogramada', body: notifBody, url: '/' }).catch(() => {});
  }

  return NextResponse.json(screening);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  // CASCADE en screeningVotes, scores y attendances — basta con borrar el screening
  await db.delete(screenings).where(eq(screenings.id, Number(id)));
  return NextResponse.json({ ok: true });
}
