export const metadata = { title: 'Mi perfil — Cine Terabithia' };
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { users, attendances, recommendations, scores } from '@/db/schema';
import { eq, avg, count } from 'drizzle-orm';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.name) redirect('/');

  const db = getDb();
  const rows = await db.select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users).where(eq(users.username, session.user.name)).limit(1);
  const user = rows[0];

  if (!user) redirect('/');

  const [ticketRows, suggestionRows, scoreRows] = await Promise.all([
    db.select({ cnt: count(attendances.id) }).from(attendances).where(eq(attendances.userId, user.id)),
    db.select({ cnt: count(recommendations.id) }).from(recommendations).where(eq(recommendations.suggestedById, user.id)),
    db.select({ avg: avg(scores.score) }).from(scores).where(eq(scores.userId, user.id)),
  ]);

  const ticketCount = Number(ticketRows[0]?.cnt ?? 0);
  const avgRaw = Number(scoreRows[0]?.avg ?? 0);
  const stats = {
    ticketCount,
    suggestions: Number(suggestionRows[0]?.cnt ?? 0),
    avgScore: ticketCount > 0 && avgRaw > 0 ? Math.round(avgRaw * 10) / 10 : null,
  };

  return (
    <PerfilClient
      username={user.username}
      initialDisplayName={user.displayName ?? null}
      initialAvatar={user.avatar ?? null}
      stats={stats}
    />
  );
}
