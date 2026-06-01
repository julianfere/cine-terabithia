export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllScreenings, getRecommendations, getAssignedRecommendations } from '@/lib/data';
import { getDb } from '@/db';
import { users, pushSubscriptions, notificationLogs, pageViews } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') redirect('/login');

  const db = getDb();
  const [screenings, recs, assignedRecs, allUsers, subs, logs, analyticsData] = await Promise.all([
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
    // Analytics: últimas 500 vistas para procesar en cliente
    db.select({
      id: pageViews.id,
      path: pageViews.path,
      userId: pageViews.userId,
      sessionId: pageViews.sessionId,
      createdAt: pageViews.createdAt,
    }).from(pageViews).orderBy(desc(pageViews.createdAt)).limit(500),
  ]);

  return (
    <AdminClient
      screenings={screenings}
      recs={recs}
      assignedRecs={assignedRecs}
      initialUsers={allUsers}
      subscribedUserIds={[...new Set(subs.map((s) => s.userId))]}
      initialLogs={logs}
      analyticsRows={analyticsData}
    />
  );
}
