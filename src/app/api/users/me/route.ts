import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { AVATARS } from '@/lib/avatars';
import { parseGradAvatar, GRADIENTS, SHAPES, FONTS, ICONS } from '@/lib/gradientAvatars';

export async function GET() {
  const session = await auth();
  const username = session?.user?.name;
  if (!username) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const db = getDb();
  const rows = await db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar, role: users.role, lastSeenChangelog: users.lastSeenChangelog })
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

  const updates: { displayName?: string | null; avatar?: string | null; lastSeenChangelog?: number } = {};

  if ('displayName' in body) {
    const dn = typeof body.displayName === 'string' ? body.displayName.trim() : null;
    updates.displayName = dn || null;
  }
  if ('avatar' in body) {
    const av = typeof body.avatar === 'string' ? body.avatar : null;
    let valid = av === null || AVATARS.some((a) => a.id === av);
    if (!valid && av !== null) {
      const parsed = parseGradAvatar(av);
      if (parsed) {
        const gradOk  = GRADIENTS.some((g) => g.id === parsed.gradientId);
        const shapeOk = SHAPES.some((s) => s.id === parsed.shapeId);
        const contentOk = parsed.contentStr.startsWith('icon-')
          ? ICONS.some((i) => i.id === parsed.contentStr.slice(5))
          : parsed.contentStr.startsWith('init-') && FONTS.some((f) => f.id === parsed.contentStr.slice(5));
        valid = gradOk && shapeOk && contentOk;
      }
    }
    if (!valid) return NextResponse.json({ error: 'Avatar inválido' }, { status: 400 });
    updates.avatar = av;
  }

  if ('lastSeenChangelog' in body && typeof body.lastSeenChangelog === 'number') {
    updates.lastSeenChangelog = body.lastSeenChangelog;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await db.update(users).set(updates).where(eq(users.username, username));

  const updated = await db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users).where(eq(users.username, username)).limit(1);

  return NextResponse.json(updated[0]);
}
