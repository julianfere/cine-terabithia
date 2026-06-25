import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaGames, triviaQuestions, triviaOptions, triviaTeams, triviaTeamMembers, users } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [game] = await db.select().from(triviaGames).where(eq(triviaGames.id, Number(id))).limit(1);
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const questions = await db
    .select()
    .from(triviaQuestions)
    .where(eq(triviaQuestions.gameId, Number(id)))
    .orderBy(asc(triviaQuestions.order));

  const questionIds = questions.map((q) => q.id);
  const options = questionIds.length
    ? await db.select().from(triviaOptions).where(inArray(triviaOptions.questionId, questionIds)).orderBy(asc(triviaOptions.order))
    : [];

  const questionsWithOptions = questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.questionId === q.id),
  }));

  const teams = await db.select().from(triviaTeams).where(eq(triviaTeams.gameId, Number(id)));
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

  const teamsWithMembers = teams.map((t) => ({
    ...t,
    members: members.filter((m) => m.teamId === t.id),
  }));

  return NextResponse.json({ ...game, questions: questionsWithOptions, teams: teamsWithMembers });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const [game] = await db
    .update(triviaGames)
    .set(body)
    .where(eq(triviaGames.id, Number(id)))
    .returning();

  return NextResponse.json(game);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  await db.delete(triviaGames).where(eq(triviaGames.id, Number(id)));
  return NextResponse.json({ ok: true });
}
