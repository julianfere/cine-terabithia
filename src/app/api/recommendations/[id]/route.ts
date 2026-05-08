import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendations, movies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, numId));
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = Number(session.user.id);
  if (session.user?.role !== 'admin' && rec.suggestedById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // CASCADE elimina recommendationVotes y screeningVotes automáticamente
  await db.delete(recommendations).where(eq(recommendations.id, numId));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const numId = Number(id);
  const db = getDb();
  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, numId));
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = Number(session.user.id);
  if (session.user?.role !== 'admin' && rec.suggestedById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, year, director, genre, duration, posterPath, posterHue, tmdbId, synopsis, ...recFields } = body;

  // Campos de la recommendation (reason, featured)
  const recUpdate: Record<string, unknown> = {};
  if ('reason' in recFields) recUpdate.reason = recFields.reason;
  if ('featured' in recFields) recUpdate.featured = recFields.featured;

  if (Object.keys(recUpdate).length > 0) {
    await db.update(recommendations).set(recUpdate).where(eq(recommendations.id, numId));
  }

  // Campos de la película asociada
  const movieUpdate: Record<string, unknown> = {};
  if (title !== undefined) movieUpdate.title = title;
  if (year !== undefined) movieUpdate.year = year;
  if (director !== undefined) movieUpdate.director = director;
  if (genre !== undefined) movieUpdate.genre = genre;
  if (duration !== undefined) movieUpdate.duration = duration;
  if (posterPath !== undefined) movieUpdate.posterPath = posterPath;
  if (posterHue !== undefined) movieUpdate.posterHue = posterHue;
  if (tmdbId !== undefined) movieUpdate.tmdbId = tmdbId;
  if (synopsis !== undefined) movieUpdate.synopsis = synopsis;

  if (Object.keys(movieUpdate).length > 0) {
    await db.update(movies).set(movieUpdate).where(eq(movies.id, rec.movieId));
  }

  const [updated] = await db.select().from(recommendations).where(eq(recommendations.id, numId));
  return NextResponse.json(updated);
}
