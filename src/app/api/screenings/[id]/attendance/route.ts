import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendances } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const existing = await db.select()
    .from(attendances)
    .where(and(eq(attendances.screeningId, Number(id)), eq(attendances.username, username)))
    .limit(1);

  if (existing[0]) {
    await db.delete(attendances).where(eq(attendances.id, existing[0].id));
    return NextResponse.json({ attending: false });
  }

  await db.insert(attendances).values({
    screeningId: Number(id),
    username,
    createdAt: Date.now(),
  });
  return NextResponse.json({ attending: true }, { status: 201 });
}
