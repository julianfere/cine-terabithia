export const dynamic = 'force-dynamic';
import { getRecommendations, getUserRecommendationVotes } from '@/lib/data';
import WatchlistClient from './WatchlistClient';
import { auth } from '@/auth';

export default async function Watchlist() {
  const recs = await getRecommendations();
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const username = session?.user?.name ?? null;
  const votedIds = userId ? await getUserRecommendationVotes(userId) : [];
  return <WatchlistClient initialRecs={recs} username={username} initialVotedIds={votedIds} />;
}
