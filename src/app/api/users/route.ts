import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const rows = db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { username, password, role } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'username y password requeridos' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const db = getDb();

  try {
    const result = db.insert(users).values({
      username: username.trim(),
      password: hash,
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: Date.now(),
    }).returning({ id: users.id, username: users.username, role: users.role }).get();
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 });
  }
}
