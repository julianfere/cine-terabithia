import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames, triviaQuestions, triviaOptions, triviaTeams, triviaTeamMembers, triviaAnswers, users } from '@/db/schema';
import { eq, asc, inArray, sum, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const gameId = Number(id);
  const userId = Number(session.user.id);

  const [game] = await db.select().from(triviaGames).where(eq(triviaGames.id, gameId)).limit(1);
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allQuestions = await db
    .select()
    .from(triviaQuestions)
    .where(eq(triviaQuestions.gameId, gameId))
    .orderBy(asc(triviaQuestions.order));
  const totalQuestions = allQuestions.length;

  let currentQuestion = null;
  if (game.currentQuestionIndex >= 0 && game.currentQuestionIndex < totalQuestions) {
    const q = allQuestions[game.currentQuestionIndex];
    const rawOptions = q.type === 'multiple_choice'
      ? await db.select().from(triviaOptions).where(eq(triviaOptions.questionId, q.id)).orderBy(asc(triviaOptions.order))
      : [];
    // Hide isCorrect from clients unless game is finished
    const options = game.status === 'finished'
      ? rawOptions
      : rawOptions.map(({ isCorrect: _ic, ...rest }) => rest);
    currentQuestion = { ...q, options };
  }

  const teams = await db.select().from(triviaTeams).where(eq(triviaTeams.gameId, gameId));
  const teamIds = teams.map((t) => t.id);

  const members = teamIds.length
    ? await db
        .select({
          teamId: triviaTeamMembers.teamId,
          userId: triviaTeamMembers.userId,
          displayName: users.displayName,
          username: users.username,
          avatar: users.avatar,
        })
        .from(triviaTeamMembers)
        .innerJoin(users, eq(triviaTeamMembers.userId, users.id))
        .where(inArray(triviaTeamMembers.teamId, teamIds))
    : [];

  const scores = teamIds.length
    ? await db
        .select({
          teamId: triviaAnswers.teamId,
          total: sum(triviaAnswers.pointsAwarded),
        })
        .from(triviaAnswers)
        .where(inArray(triviaAnswers.teamId, teamIds))
        .groupBy(triviaAnswers.teamId)
    : [];

  const teamsWithScore = teams.map((t) => ({
    ...t,
    score: Number(scores.find((s) => s.teamId === t.id)?.total ?? 0),
    members: members.filter((m) => m.teamId === t.id),
  }));

  const myTeamId = members.find((m) => m.userId === userId)?.teamId ?? null;

  let myAnswer = null;
  if (currentQuestion && currentQuestion.type === 'multiple_choice' && myTeamId) {
    const [ans] = await db
      .select()
      .from(triviaAnswers)
      .where(and(eq(triviaAnswers.questionId, currentQuestion.id), eq(triviaAnswers.teamId, myTeamId)))
      .limit(1);
    if (ans) myAnswer = { optionId: ans.optionId, isCorrect: ans.isCorrect };
  }

  return NextResponse.json({
    status: game.status,
    currentQuestionIndex: game.currentQuestionIndex,
    questionCount: totalQuestions,
    currentQuestion,
    teams: teamsWithScore,
    myTeamId,
    myAnswer,
  });
}
