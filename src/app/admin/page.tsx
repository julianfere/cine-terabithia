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

  const screenings = getAllScreenings();
  const recs = getRecommendations();
  const db = getDb();
  const allUsers = db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).all();

  return <AdminClient screenings={screenings} recs={recs} initialUsers={allUsers} />;
}
