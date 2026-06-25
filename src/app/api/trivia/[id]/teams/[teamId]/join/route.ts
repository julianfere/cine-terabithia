import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaTeams, triviaTeamMembers } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

// POST /api/trivia/[id]/teams/[teamId]/join
// User joins a team. If already on another team in this game, they leave it first.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, teamId } = await params;
  const db = getDb();
  const gameId = Number(id);
  const teamIdNum = Number(teamId);
  const userId = Number(session.user.id);

  // Verify team belongs to this game
  const [team] = await db.select().from(triviaTeams).where(and(eq(triviaTeams.id, teamIdNum), eq(triviaTeams.gameId, gameId))).limit(1);
  if (!team) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });

  // Remove from any existing team in this game
  const teamsInGame = await db.select({ id: triviaTeams.id }).from(triviaTeams).where(eq(triviaTeams.gameId, gameId));
  const gameTeamIds = teamsInGame.map((t) => t.id);
  if (gameTeamIds.length) {
    await db.delete(triviaTeamMembers).where(
      and(eq(triviaTeamMembers.userId, userId), inArray(triviaTeamMembers.teamId, gameTeamIds))
    );
  }

  const [membership] = await db
    .insert(triviaTeamMembers)
    .values({ teamId: teamIdNum, userId })
    .returning();

  return NextResponse.json(membership, { status: 201 });
}
