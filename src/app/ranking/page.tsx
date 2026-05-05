export const dynamic = 'force-dynamic';
import { getPastScreenings } from '@/lib/data';
import RankingClient from './RankingClient';

export default async function Ranking() {
  const past = await getPastScreenings();
  const ranked = [...past].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
  return <RankingClient ranked={ranked} />;
}
