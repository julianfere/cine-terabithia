import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TriviaGameClient from './TriviaGameClient';

export const dynamic = 'force-dynamic';

export default async function TriviaGamePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;
  return <TriviaGameClient gameId={id} userId={Number(session.user.id)} />;
}
