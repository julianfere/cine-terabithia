export const dynamic = 'force-dynamic';
import { getRecommendations } from '@/lib/data';
import WatchlistClient from './WatchlistClient';
import { auth } from '@/auth';

export default async function Watchlist() {
  const recs = getRecommendations();
  const session = await auth();
  const username = session?.user?.name ?? null;
  return <WatchlistClient initialRecs={recs} username={username} />;
}
