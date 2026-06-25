import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TriviaModerator from './TriviaModerator';

export const dynamic = 'force-dynamic';

export default async function TriviaModeratePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');
  const { id } = await params;
  return <TriviaModerator gameId={id} />;
}
