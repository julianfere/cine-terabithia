import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames, triviaQuestions, triviaTeams, triviaAnswers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

// POST /api/trivia/[id]/award
// Admin manually awards points to a team (for open/verbal questions).
// Body: { teamId, questionId, points? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { teamId, questionId } = body;
  if (!teamId || !questionId) return NextResponse.json({ error: 'teamId y questionId requeridos' }, { status: 400 });

  const db = getDb();
  const gameId = Number(id);

  const [game] = await db.select().from(triviaGames).where(eq(triviaGames.id, gameId)).limit(1);
  if (!game || game.status !== 'active') return NextResponse.json({ error: 'El juego no está activo' }, { status: 400 });

  const [question] = await db.select().from(triviaQuestions).where(eq(triviaQuestions.id, Number(questionId))).limit(1);
  if (!question || question.gameId !== gameId) return NextResponse.json({ error: 'Pregunta inválida' }, { status: 400 });

  const [team] = await db.select().from(triviaTeams).where(and(eq(triviaTeams.id, Number(teamId)), eq(triviaTeams.gameId, gameId))).limit(1);
  if (!team) return NextResponse.json({ error: 'Equipo inválido' }, { status: 400 });

  const pointsToAward = body.points ?? question.points;

  // Upsert: if already exists, update points; otherwise insert
  const [existing] = await db
    .select()
    .from(triviaAnswers)
    .where(and(eq(triviaAnswers.questionId, Number(questionId)), eq(triviaAnswers.teamId, Number(teamId))))
    .limit(1);

  let answer;
  if (existing) {
    [answer] = await db
      .update(triviaAnswers)
      .set({ isCorrect: true, pointsAwarded: Number(pointsToAward) })
      .where(and(eq(triviaAnswers.questionId, Number(questionId)), eq(triviaAnswers.teamId, Number(teamId))))
      .returning();
  } else {
    [answer] = await db
      .insert(triviaAnswers)
      .values({
        questionId: Number(questionId),
        teamId: Number(teamId),
        optionId: null,
        isCorrect: true,
        pointsAwarded: Number(pointsToAward),
      })
      .returning();
  }

  return NextResponse.json(answer);
}
