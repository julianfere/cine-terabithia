import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { recommendationComments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { commentId } = await params;
  const cId = Number(commentId);
  if (isNaN(cId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

  const db = getDb();
  const [updated] = await db
    .update(recommendationComments)
    .set({ content: content.trim() })
    .where(and(eq(recommendationComments.id, cId), eq(recommendationComments.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'No encontrado o sin permiso' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { commentId } = await params;
  const cId = Number(commentId);
  if (isNaN(cId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  const isAdmin = session?.user?.role === 'admin';
  const condition = isAdmin
    ? eq(recommendationComments.id, cId)
    : and(eq(recommendationComments.id, cId), eq(recommendationComments.userId, userId));

  const [deleted] = await db.delete(recommendationComments).where(condition).returning();
  if (!deleted) return NextResponse.json({ error: 'No encontrado o sin permiso' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
