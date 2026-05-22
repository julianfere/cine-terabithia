import type { Metadata } from 'next';
import { getScreeningById, getScoresForScreening, getAttendanceForScreening } from '@/lib/data';
import { notFound } from 'next/navigation';
import DetalleClient from './DetalleClient';
import { auth } from '@/auth';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const screening = await getScreeningById(Number(id));
  if (!screening) return {
    title: 'Cine Terabithia',
    openGraph: { title: 'Cine Terabithia', description: 'Club de cine entre amigos', siteName: 'Cine Terabithia' },
  };

  const title = screening.title
    ? `${screening.title} — Cine Terabithia`
    : 'Próxima función — Cine Terabithia';

  const datePart = screening.scheduledDate
    ? new Date(screening.scheduledDate + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  const parts = [datePart, screening.hour, screening.location].filter(Boolean);
  const description = parts.length
    ? `${parts.join(' · ')} · Confirmá tu asistencia al Club`
    : 'Confirmá tu asistencia al Cine Terabithia';

  const images = screening.posterPath
    ? [{ url: `https://image.tmdb.org/t/p/w500${screening.posterPath}`, width: 500, height: 750, alt: screening.title ?? 'Póster' }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      url: `https://cine-terabithia.vercel.app/funciones/${id}`,
      siteName: 'Cine Terabithia',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function DetallePage({ params }: Props) {
  const { id } = await params;
  const [screening, scores, session, attendance] = await Promise.all([
    getScreeningById(Number(id)),
    getScoresForScreening(Number(id)),
    auth(),
    getAttendanceForScreening(Number(id)),
  ]);

  if (!screening) notFound();

  const username = session?.user?.name ?? null;
  const isAttending = username ? attendance.some((a) => a.username === username) : false;
  return <DetalleClient screening={screening} scores={scores} username={username} initialAttendance={attendance} isAttending={isAttending} />;
}
