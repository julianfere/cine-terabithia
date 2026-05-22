export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calendario — Cine Terabithia' };
import { getAllScreenings } from '@/lib/data';
import CalendarioClient from './CalendarioClient';

export default async function Calendario() {
  const screenings = await getAllScreenings();
  return <CalendarioClient screenings={screenings} />;
}
