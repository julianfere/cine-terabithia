import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendances } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, userId } = await params;
  const db = getDb();
  await db
    .delete(attendances)
    .where(and(eq(attendances.screeningId, Number(id)), eq(attendances.userId, Number(userId))));

  return NextResponse.json({ ok: true });
}
