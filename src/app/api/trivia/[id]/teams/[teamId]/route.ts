import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaTeams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { teamId } = await params;
  const body = await req.json();
  const db = getDb();

  const [team] = await db
    .update(triviaTeams)
    .set(body)
    .where(eq(triviaTeams.id, Number(teamId)))
    .returning();

  return NextResponse.json(team);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { teamId } = await params;
  const db = getDb();
  await db.delete(triviaTeams).where(eq(triviaTeams.id, Number(teamId)));
  return NextResponse.json({ ok: true });
}
