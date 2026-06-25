import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TriviaEditor from './TriviaEditor';

export const dynamic = 'force-dynamic';

export default async function TriviaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');
  const { id } = await params;
  return <TriviaEditor gameId={id} />;
}
