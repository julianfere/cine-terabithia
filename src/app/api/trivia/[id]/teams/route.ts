import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaTeams, triviaTeamMembers, users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const gameId = Number(id);

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

  const result = teams.map((t) => ({
    ...t,
    members: members.filter((m) => m.teamId === t.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, color = '#e46217' } = body;
  if (!name) return NextResponse.json({ error: 'name requerido' }, { status: 400 });

  const db = getDb();
  const [team] = await db
    .insert(triviaTeams)
    .values({ gameId: Number(id), name, color })
    .returning();

  return NextResponse.json({ ...team, members: [] }, { status: 201 });
}
