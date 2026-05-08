import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAttendedScreeningsForUser } from '@/lib/data';
import TicketsClient from './TicketsClient';

export const metadata = { title: 'Mis tickets — Cine Terabithia' };

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user?.name) redirect('/login');

  const userId = Number(session.user.id);
  const username = session.user.name;
  const tickets = await getAttendedScreeningsForUser(userId);

  return <TicketsClient tickets={tickets} username={username} />;
}
