import { getScreeningById, getScoresForScreening } from '@/lib/data';
import { notFound } from 'next/navigation';
import DetalleClient from './DetalleClient';
import { auth } from '@/auth';

export default async function DetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const screening = getScreeningById(Number(id));
  if (!screening) notFound();

  const scores = getScoresForScreening(Number(id));
  const session = await auth();
  const username = session?.user?.name ?? null;

  return <DetalleClient screening={screening} scores={scores} username={username} />;
}
