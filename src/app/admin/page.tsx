export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllScreenings, getRecommendations } from '@/lib/data';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') redirect('/login');

  const db = getDb();
  const [screenings, recs, allUsers] = await Promise.all([
    getAllScreenings(),
    getRecommendations(),
    db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users),
  ]);

  return <AdminClient screenings={screenings} recs={recs} initialUsers={allUsers} />;
}
