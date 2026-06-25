import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaQuestions, triviaOptions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; qId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { qId } = await params;
  const body = await req.json();
  const { options, ...questionFields } = body;

  const db = getDb();
  const qIdNum = Number(qId);

  const [question] = await db
    .update(triviaQuestions)
    .set(questionFields)
    .where(eq(triviaQuestions.id, qIdNum))
    .returning();

  if (options !== undefined) {
    await db.delete(triviaOptions).where(eq(triviaOptions.questionId, qIdNum));
    if (options.length > 0) {
      await db.insert(triviaOptions).values(
        options.map((o: { text: string; isCorrect?: boolean }, i: number) => ({
          questionId: qIdNum,
          text: o.text,
          isCorrect: o.isCorrect ?? false,
          order: i,
        }))
      );
    }
  }

  const updatedOptions = await db
    .select()
    .from(triviaOptions)
    .where(eq(triviaOptions.questionId, qIdNum))
    .orderBy(asc(triviaOptions.order));

  return NextResponse.json({ ...question, options: updatedOptions });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; qId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { qId } = await params;
  const db = getDb();
  await db.delete(triviaQuestions).where(eq(triviaQuestions.id, Number(qId)));
  return NextResponse.json({ ok: true });
}
