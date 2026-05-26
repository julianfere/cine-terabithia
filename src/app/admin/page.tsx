export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllScreenings, getRecommendations, getAssignedRecommendations } from '@/lib/data';
import { getDb } from '@/db';
import { users, pushSubscriptions, notificationLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') redirect('/login');

  const db = getDb();
  const [screenings, recs, assignedRecs, allUsers, subs, logs] = await Promise.all([
    getAllScreenings(),
    getRecommendations(),
    getAssignedRecommendations(),
    db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users),
    db.select({ userId: pushSubscriptions.userId }).from(pushSubscriptions),
    db.select().from(notificationLogs).orderBy(desc(notificationLogs.sentAt)).limit(50),
  ]);

  return (
    <AdminClient
      screenings={screenings}
      recs={recs}
      assignedRecs={assignedRecs}
      initialUsers={allUsers}
      subscribedUserIds={[...new Set(subs.map((s) => s.userId))]}
      initialLogs={logs}
    />
  );
}
