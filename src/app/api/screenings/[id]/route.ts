import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { screenings, scores, screeningVotes, movies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const { title, year, director, genre, duration, synopsis, posterPath, tmdbId, ...screeningFields } = body;
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

  return NextResponse.json(screening);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  await db.delete(screeningVotes).where(eq(screeningVotes.screeningId, numId));
  await db.delete(scores).where(eq(scores.screeningId, numId));
  await db.delete(screenings).where(eq(screenings.id, numId));
  return NextResponse.json({ ok: true });
}
