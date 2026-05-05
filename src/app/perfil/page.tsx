import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.name) redirect('/');

  const db = getDb();
  const user = db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users).where(eq(users.username, session.user.name)).get();

  if (!user) redirect('/');

  return (
    <PerfilClient
      username={user.username}
      initialDisplayName={user.displayName ?? null}
      initialAvatar={user.avatar ?? null}
    />
  );
}
