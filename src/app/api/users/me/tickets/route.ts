import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAttendedScreeningsForUser } from '@/lib/data';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const tickets = await getAttendedScreeningsForUser(userId);
  return NextResponse.json(tickets);
}
