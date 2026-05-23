export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sugeridos — Cine Terabithia' };
import { getPublicRecommendations, getUserRecommendationVotes } from '@/lib/data';
import WatchlistClient from './WatchlistClient';
import { auth } from '@/auth';

export default async function Watchlist() {
  const recs = await getPublicRecommendations();
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const username = session?.user?.name ?? null;
  const votedIds = userId ? await getUserRecommendationVotes(userId) : [];
  return <WatchlistClient initialRecs={recs} username={username} initialVotedIds={votedIds} />;
}
