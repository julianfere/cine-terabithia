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

  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, Number(recommendationId))).limit(1);
  if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });

  await db.update(screenings).set({ movieId: rec.movieId }).where(eq(screenings.id, Number(id)));
  await db.update(recommendations).set({ status: 'assigned' }).where(eq(recommendations.id, Number(recommendationId)));

  const [updated] = await db
    .select({
      id: screenings.id,
      scheduledDate: screenings.scheduledDate,
      hour: screenings.hour,
      status: screenings.status,
      movieId: screenings.movieId,
      title: movies.title,
      year: movies.year,
      director: movies.director,
      genre: movies.genre,
      posterPath: movies.posterPath,
      posterHue: movies.posterHue,
    })
    .from(screenings)
    .leftJoin(movies, eq(screenings.movieId, movies.id))
    .where(eq(screenings.id, Number(id)))
    .limit(1);

  return NextResponse.json(updated);
}
