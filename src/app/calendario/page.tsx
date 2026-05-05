export const dynamic = 'force-dynamic';
import { getAllScreenings } from '@/lib/data';
import CalendarioClient from './CalendarioClient';

export default async function Calendario() {
  const screenings = await getAllScreenings();
  return <CalendarioClient screenings={screenings} />;
}
