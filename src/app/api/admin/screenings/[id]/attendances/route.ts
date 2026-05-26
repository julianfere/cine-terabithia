import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendances, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
    })
    .from(attendances)
    .innerJoin(users, eq(attendances.userId, users.id))
    .where(eq(attendances.screeningId, Number(id)));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });

  const db = getDb();
  const existing = await db
    .select({ id: attendances.id })
    .from(attendances)
    .where(and(eq(attendances.screeningId, Number(id)), eq(attendances.userId, Number(userId))))
    .limit(1);

  if (existing[0]) return NextResponse.json({ error: 'Ya tiene ticket' }, { status: 409 });

  await db.insert(attendances).values({ screeningId: Number(id), userId: Number(userId) });
  return NextResponse.json({ ok: true }, { status: 201 });
}
