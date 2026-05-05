import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña requeridos.' }, { status: 400 });
  }
  if (username.trim().length < 2) {
    return NextResponse.json({ error: 'El usuario debe tener al menos 2 caracteres.' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres.' }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username.trim())).limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: 'Ese usuario ya existe.' }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    username: username.trim(),
    password: hash,
    role: 'user',
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
