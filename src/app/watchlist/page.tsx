export const dynamic = 'force-dynamic';
import { getRecommendations, getUserRecommendationVotes } from '@/lib/data';
import WatchlistClient from './WatchlistClient';
import { auth } from '@/auth';

export default async function Watchlist() {
  const recs = await getRecommendations();
  const session = await auth();
  const username = session?.user?.name ?? null;
  const votedIds = username ? await getUserRecommendationVotes(username) : [];
  return <WatchlistClient initialRecs={recs} username={username} initialVotedIds={votedIds} />;
}
