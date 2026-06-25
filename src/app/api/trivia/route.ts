import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const db = getDb();
  const query = db.select().from(triviaGames).orderBy(desc(triviaGames.createdAt));
  const games = status
    ? await db.select().from(triviaGames).where(eq(triviaGames.status, status)).orderBy(desc(triviaGames.createdAt))
    : await query;

  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, screeningId } = body;
  if (!name) return NextResponse.json({ error: 'name requerido' }, { status: 400 });

  const db = getDb();
  const [game] = await db.insert(triviaGames).values({
    name,
    screeningId: screeningId ?? null,
    createdBy: Number(session.user.id),
  }).returning();

  return NextResponse.json(game, { status: 201 });
}
