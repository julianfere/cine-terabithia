import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames, triviaQuestions, triviaOptions, triviaTeams, triviaTeamMembers, triviaAnswers } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

// POST /api/trivia/[id]/answer
// Submit a multiple-choice answer on behalf of the user's team.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { optionId } = body;
  if (!optionId) return NextResponse.json({ error: 'optionId requerido' }, { status: 400 });

  const db = getDb();
  const gameId = Number(id);
  const userId = Number(session.user.id);

  const [game] = await db.select().from(triviaGames).where(eq(triviaGames.id, gameId)).limit(1);
  if (!game || game.status !== 'active') return NextResponse.json({ error: 'El juego no está activo' }, { status: 400 });

  // Get current question
  const questions = await db
    .select()
    .from(triviaQuestions)
    .where(eq(triviaQuestions.gameId, gameId))
    .orderBy(triviaQuestions.order);

  const currentQuestion = questions[game.currentQuestionIndex];
  if (!currentQuestion || currentQuestion.type !== 'multiple_choice') {
    return NextResponse.json({ error: 'Pregunta no disponible para respuesta digital' }, { status: 400 });
  }

  // Find user's team
  const teamsInGame = await db.select({ id: triviaTeams.id }).from(triviaTeams).where(eq(triviaTeams.gameId, gameId));
  const gameTeamIds = teamsInGame.map((t) => t.id);
  if (!gameTeamIds.length) return NextResponse.json({ error: 'No hay equipos en el juego' }, { status: 400 });

  const [membership] = await db
    .select()
    .from(triviaTeamMembers)
    .where(and(eq(triviaTeamMembers.userId, userId), inArray(triviaTeamMembers.teamId, gameTeamIds)))
    .limit(1);

  if (!membership) return NextResponse.json({ error: 'No estás en ningún equipo' }, { status: 403 });

  // Check already answered
  const [existing] = await db
    .select()
    .from(triviaAnswers)
    .where(and(eq(triviaAnswers.questionId, currentQuestion.id), eq(triviaAnswers.teamId, membership.teamId)))
    .limit(1);

  if (existing) return NextResponse.json({ error: 'Tu equipo ya respondió esta pregunta' }, { status: 409 });

  // Validate option and check correctness
  const [option] = await db.select().from(triviaOptions).where(eq(triviaOptions.id, Number(optionId))).limit(1);
  if (!option || option.questionId !== currentQuestion.id) {
    return NextResponse.json({ error: 'Opción inválida' }, { status: 400 });
  }

  const isCorrect = option.isCorrect;
  const pointsAwarded = isCorrect ? currentQuestion.points : 0;

  const [answer] = await db
    .insert(triviaAnswers)
    .values({
      questionId: currentQuestion.id,
      teamId: membership.teamId,
      optionId: option.id,
      isCorrect,
      pointsAwarded,
    })
    .returning();

  return NextResponse.json({ ...answer, isCorrect }, { status: 201 });
}
