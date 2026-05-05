import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAttendedScreeningsForUser } from '@/lib/data';

export async function GET() {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const tickets = await getAttendedScreeningsForUser(username);
  return NextResponse.json(tickets);
}
