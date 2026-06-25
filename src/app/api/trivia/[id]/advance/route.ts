import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames, triviaQuestions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/auth';

// POST /api/trivia/[id]/advance
// Transitions the game through states:
//   draft → lobby (launch lobby)
//   lobby → active + currentQuestionIndex=0 (start game)
//   active: advance to next question, or finish if at last question
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  const gameId = Number(id);

  const [game] = await db.select().from(triviaGames).where(eq(triviaGames.id, gameId)).limit(1);
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = Date.now();

  if (game.status === 'draft') {
    const [updated] = await db
      .update(triviaGames)
      .set({ status: 'lobby' })
      .where(eq(triviaGames.id, gameId))
      .returning();
    return NextResponse.json(updated);
  }

  if (game.status === 'lobby') {
    const questions = await db
      .select({ id: triviaQuestions.id })
      .from(triviaQuestions)
      .where(eq(triviaQuestions.gameId, gameId))
      .orderBy(asc(triviaQuestions.order));

    if (questions.length === 0) {
      return NextResponse.json({ error: 'El juego no tiene preguntas' }, { status: 400 });
    }

    const [updated] = await db
      .update(triviaGames)
      .set({ status: 'active', currentQuestionIndex: 0, startedAt: now })
      .where(eq(triviaGames.id, gameId))
      .returning();
    return NextResponse.json(updated);
  }

  if (game.status === 'active') {
    const questions = await db
      .select({ id: triviaQuestions.id })
      .from(triviaQuestions)
      .where(eq(triviaQuestions.gameId, gameId))
      .orderBy(asc(triviaQuestions.order));

    const nextIndex = game.currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      const [updated] = await db
        .update(triviaGames)
        .set({ status: 'finished', finishedAt: now })
        .where(eq(triviaGames.id, gameId))
        .returning();
      return NextResponse.json(updated);
    }

    const [updated] = await db
      .update(triviaGames)
      .set({ currentQuestionIndex: nextIndex })
      .where(eq(triviaGames.id, gameId))
      .returning();
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'El juego ya terminó' }, { status: 400 });
}
