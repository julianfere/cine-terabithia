import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendations, recommendationVotes } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  const db = getDb();
  const rows = db.select().from(recommendations).orderBy(desc(recommendations.createdAt)).all();
  const voteCounts = db
    .select({ recId: recommendationVotes.recommendationId, cnt: count(recommendationVotes.id) })
    .from(recommendationVotes)
    .groupBy(recommendationVotes.recommendationId)
    .all();

  const voteMap = new Map(voteCounts.map((v) => [v.recId, v.cnt]));
  const result = rows
    .map((r) => ({ ...r, votes: voteMap.get(r.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { title, year, director, genre, duration, posterHue, tmdbId, posterPath, reason } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const db = getDb();
  const result = db.insert(recommendations).values({
    title, year, director, genre, duration,
    posterHue: posterHue ?? 200,
    tmdbId, posterPath,
    suggestedBy: username,
    reason,
    createdAt: Date.now(),
  }).returning().get();

  return NextResponse.json({ ...result, votes: 0 }, { status: 201 });
}
