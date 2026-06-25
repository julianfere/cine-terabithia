import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { triviaQuestions, triviaOptions } from '@/db/schema';
import { eq, asc, max, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const gameId = Number(id);

  const questions = await db
    .select()
    .from(triviaQuestions)
    .where(eq(triviaQuestions.gameId, gameId))
    .orderBy(asc(triviaQuestions.order));

  const qIds = questions.map((q) => q.id);
  const allOptions = qIds.length
    ? await db.select().from(triviaOptions).where(inArray(triviaOptions.questionId, qIds)).orderBy(asc(triviaOptions.order))
    : [];

  const result = questions.map((q) => ({
    ...q,
    options: allOptions.filter((o) => o.questionId === q.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { text, type = 'open', points = 1, imageUrl, options = [] } = body;

  if (!text) return NextResponse.json({ error: 'text requerido' }, { status: 400 });

  const db = getDb();
  const gameId = Number(id);

  const [maxOrderRow] = await db
    .select({ maxOrder: max(triviaQuestions.order) })
    .from(triviaQuestions)
    .where(eq(triviaQuestions.gameId, gameId));

  const nextOrder = (maxOrderRow?.maxOrder ?? -1) + 1;

  const [question] = await db
    .insert(triviaQuestions)
    .values({ gameId, text, type, points, imageUrl: imageUrl ?? null, order: nextOrder })
    .returning();

  let insertedOptions: typeof triviaOptions.$inferSelect[] = [];
  if (options.length > 0) {
    insertedOptions = await db
      .insert(triviaOptions)
      .values(
        options.map((o: { text: string; isCorrect?: boolean }, i: number) => ({
          questionId: question.id,
          text: o.text,
          isCorrect: o.isCorrect ?? false,
          order: i,
        }))
      )
      .returning();
  }

  return NextResponse.json({ ...question, options: insertedOptions }, { status: 201 });
}
