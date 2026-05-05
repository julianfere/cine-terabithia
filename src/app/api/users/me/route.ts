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
  const user = db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar, role: users.role })
    .from(users).where(eq(users.username, username)).get();

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
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

  db.update(users).set(updates).where(eq(users.username, username)).run();

  const updated = db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users).where(eq(users.username, username)).get();

  return NextResponse.json(updated);
}
