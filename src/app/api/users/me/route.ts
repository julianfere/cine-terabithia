import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { AVATARS } from '@/lib/avatars';

export async function GET() {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = getDb();
  const rows = await db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar, role: users.role })
    .from(users).where(eq(users.username, username)).limit(1);

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  const updates: { displayName?: string | null; avatar?: string | null } = {};

  if ('displayName' in body) {
    const dn = typeof body.displayName === 'string' ? body.displayName.trim() : null;
    updates.displayName = dn || null;
  }
  if ('avatar' in body) {
    const av = typeof body.avatar === 'string' ? body.avatar : null;
    const valid = av === null || AVATARS.some((a) => a.id === av);
    if (!valid) return NextResponse.json({ error: 'Avatar inválido' }, { status: 400 });
    updates.avatar = av;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await db.update(users).set(updates).where(eq(users.username, username));

  const updated = await db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users).where(eq(users.username, username)).limit(1);

  return NextResponse.json(updated[0]);
}
